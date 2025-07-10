-- Enhanced HubSpot Sync System with Robust Error Handling and Queue Management

-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS enqueue_hubspot_sync(UUID, TEXT, JSONB, INTEGER);
DROP FUNCTION IF EXISTS process_hubspot_sync_queue();
DROP FUNCTION IF EXISTS get_hubspot_sync_stats(UUID);

-- Create comprehensive sync log table if not exists
CREATE TABLE IF NOT EXISTS hubspot_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    negocio_id UUID NOT NULL,
    operation_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    hubspot_deal_id TEXT,
    execution_time_ms INTEGER,
    trigger_source TEXT DEFAULT 'realtime'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_negocio_id ON hubspot_sync_log(negocio_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_status ON hubspot_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_created_at ON hubspot_sync_log(created_at);

-- Enable RLS for sync log
ALTER TABLE hubspot_sync_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sync log
DROP POLICY IF EXISTS "Users can view their own sync logs" ON hubspot_sync_log;
CREATE POLICY "Users can view their own sync logs" ON hubspot_sync_log
    FOR SELECT USING (
        negocio_id IN (
            SELECT id FROM negocios WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert sync logs" ON hubspot_sync_log;
CREATE POLICY "System can insert sync logs" ON hubspot_sync_log
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update sync logs" ON hubspot_sync_log;
CREATE POLICY "System can update sync logs" ON hubspot_sync_log
    FOR UPDATE USING (true);

-- Enhanced queue management function
CREATE OR REPLACE FUNCTION enqueue_hubspot_sync(
    p_negocio_id UUID,
    p_operation_type TEXT,
    p_payload JSONB,
    p_priority INTEGER DEFAULT 5,
    p_trigger_source TEXT DEFAULT 'realtime'
)
RETURNS UUID AS $$
DECLARE
    sync_log_id UUID;
BEGIN
    -- Insert into sync log for tracking
    INSERT INTO hubspot_sync_log (
        negocio_id,
        operation_type,
        status,
        request_payload,
        trigger_source
    ) VALUES (
        p_negocio_id,
        p_operation_type,
        'pending',
        p_payload,
        p_trigger_source
    ) RETURNING id INTO sync_log_id;
    
    -- Also add to queue if it exists
    INSERT INTO hubspot_sync_queue (
        negocio_id,
        operation_type,
        priority,
        payload
    ) VALUES (
        p_negocio_id,
        p_operation_type,
        p_priority,
        p_payload
    ) ON CONFLICT DO NOTHING;
    
    RETURN sync_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced sync statistics function
CREATE OR REPLACE FUNCTION get_hubspot_sync_stats(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
    total_pending INTEGER,
    total_success_today INTEGER,
    total_failed_today INTEGER,
    total_retrying INTEGER,
    avg_execution_time_ms NUMERIC,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    success_rate_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM hubspot_sync_log hsl 
         JOIN negocios n ON hsl.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hsl.status = 'pending'),
        (SELECT COUNT(*)::INTEGER FROM hubspot_sync_log hsl 
         JOIN negocios n ON hsl.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hsl.status = 'success' 
         AND hsl.processed_at >= CURRENT_DATE),
        (SELECT COUNT(*)::INTEGER FROM hubspot_sync_log hsl 
         JOIN negocios n ON hsl.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hsl.status = 'failed' 
         AND hsl.created_at >= CURRENT_DATE),
        (SELECT COUNT(*)::INTEGER FROM hubspot_sync_log hsl 
         JOIN negocios n ON hsl.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hsl.status = 'retrying'),
        (SELECT COALESCE(AVG(hsl.execution_time_ms), 0)::NUMERIC(10,2)
         FROM hubspot_sync_log hsl 
         JOIN negocios n ON hsl.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hsl.status = 'success' 
         AND hsl.processed_at >= CURRENT_DATE - INTERVAL '7 days'),
        (SELECT MAX(hsl.processed_at)
         FROM hubspot_sync_log hsl 
         JOIN negocios n ON hsl.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hsl.status = 'success'),
        (SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE hsl.status = 'success')::NUMERIC / COUNT(*)) * 100, 2)
            END
         FROM hubspot_sync_log hsl 
         JOIN negocios n ON hsl.negocio_id = n.id 
         WHERE n.user_id = p_user_id 
         AND hsl.created_at >= CURRENT_DATE - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually retry failed syncs
CREATE OR REPLACE FUNCTION retry_failed_hubspot_syncs(p_user_id UUID DEFAULT auth.uid())
RETURNS INTEGER AS $$
DECLARE
    retried_count INTEGER := 0;
    failed_sync RECORD;
BEGIN
    -- Find failed syncs for the user that haven't exceeded max retries
    FOR failed_sync IN 
        SELECT hsl.id, hsl.negocio_id, hsl.operation_type, hsl.request_payload
        FROM hubspot_sync_log hsl 
        JOIN negocios n ON hsl.negocio_id = n.id 
        WHERE n.user_id = p_user_id 
        AND hsl.status = 'failed' 
        AND hsl.retry_count < hsl.max_retries
        AND hsl.created_at >= CURRENT_DATE - INTERVAL '24 hours'
        ORDER BY hsl.created_at DESC
        LIMIT 10
    LOOP
        -- Update status to retrying and increment retry count
        UPDATE hubspot_sync_log 
        SET status = 'retrying', 
            retry_count = retry_count + 1,
            updated_at = now()
        WHERE id = failed_sync.id;
        
        -- Re-enqueue the sync
        PERFORM enqueue_hubspot_sync(
            failed_sync.negocio_id,
            failed_sync.operation_type,
            failed_sync.request_payload,
            1, -- High priority for retries
            'manual_retry'
        );
        
        retried_count := retried_count + 1;
    END LOOP;
    
    RETURN retried_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced trigger function for automatic HubSpot sync
CREATE OR REPLACE FUNCTION trigger_hubspot_sync_on_negocio_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if estado changed and it's a significant change
    IF TG_OP = 'UPDATE' AND OLD.estado != NEW.estado THEN
        -- Log the state change
        PERFORM enqueue_hubspot_sync(
            NEW.id,
            'estado_change',
            jsonb_build_object(
                'negocio_id', NEW.id,
                'estado_anterior', OLD.estado,
                'estado_nuevo', NEW.estado,
                'hubspot_id', NEW.hubspot_id,
                'timestamp', extract(epoch from now())
            ),
            3, -- Medium priority
            'database_trigger'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for negocios state changes
DROP TRIGGER IF EXISTS hubspot_sync_on_negocio_estado_change ON negocios;
CREATE TRIGGER hubspot_sync_on_negocio_estado_change
    AFTER UPDATE ON negocios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_hubspot_sync_on_negocio_update();

-- Add updated_at trigger for sync log
CREATE TRIGGER update_hubspot_sync_log_updated_at
    BEFORE UPDATE ON hubspot_sync_log
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();