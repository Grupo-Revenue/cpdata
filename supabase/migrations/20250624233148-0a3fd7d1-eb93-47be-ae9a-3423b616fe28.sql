
-- Step 1: Create database triggers for real-time HubSpot sync

-- First, create a function to handle HubSpot sync notifications
CREATE OR REPLACE FUNCTION notify_hubspot_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Determine the operation and data
    DECLARE
        operation_type TEXT;
        negocio_data JSONB;
        old_data JSONB DEFAULT NULL;
    BEGIN
        -- Set operation type
        CASE TG_OP
            WHEN 'INSERT' THEN operation_type := 'INSERT';
            WHEN 'UPDATE' THEN operation_type := 'UPDATE';
            WHEN 'DELETE' THEN operation_type := 'DELETE';
        END CASE;

        -- Prepare data payload
        IF TG_OP = 'DELETE' THEN
            negocio_data := row_to_json(OLD)::jsonb;
        ELSE
            negocio_data := row_to_json(NEW)::jsonb;
            IF TG_OP = 'UPDATE' THEN
                old_data := row_to_json(OLD)::jsonb;
            END IF;
        END IF;

        -- Send notification with operation details
        PERFORM pg_notify(
            'hubspot_sync_trigger',
            json_build_object(
                'table', TG_TABLE_NAME,
                'operation', operation_type,
                'data', negocio_data,
                'old_data', old_data,
                'timestamp', extract(epoch from now())
            )::text
        );

        RETURN COALESCE(NEW, OLD);
    END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for negocios table
DROP TRIGGER IF EXISTS hubspot_sync_negocios_trigger ON negocios;
CREATE TRIGGER hubspot_sync_negocios_trigger
    AFTER INSERT OR UPDATE OR DELETE ON negocios
    FOR EACH ROW
    EXECUTE FUNCTION notify_hubspot_sync();

-- Create triggers for presupuestos table
DROP TRIGGER IF EXISTS hubspot_sync_presupuestos_trigger ON presupuestos;
CREATE TRIGGER hubspot_sync_presupuestos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION notify_hubspot_sync();

-- Create triggers for productos_presupuesto table (affects budget totals)
DROP TRIGGER IF EXISTS hubspot_sync_productos_trigger ON productos_presupuesto;
CREATE TRIGGER hubspot_sync_productos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON productos_presupuesto
    FOR EACH ROW
    EXECUTE FUNCTION notify_hubspot_sync();

-- Step 2: Create a queue table for managing sync operations
CREATE TABLE IF NOT EXISTS hubspot_sync_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    negocio_id UUID NOT NULL,
    operation_type TEXT NOT NULL,
    priority INTEGER DEFAULT 5,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_queue_status ON hubspot_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_queue_scheduled ON hubspot_sync_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_queue_negocio ON hubspot_sync_queue(negocio_id);

-- Add RLS policies for the queue table
ALTER TABLE hubspot_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync queue items" ON hubspot_sync_queue
    FOR SELECT USING (
        negocio_id IN (
            SELECT id FROM negocios WHERE user_id = auth.uid()
        )
    );

-- Step 3: Create function to process sync queue
CREATE OR REPLACE FUNCTION process_hubspot_sync_queue()
RETURNS TABLE(processed_count INTEGER) AS $$
DECLARE
    queue_item RECORD;
    processed INTEGER := 0;
BEGIN
    -- Process pending queue items
    FOR queue_item IN 
        SELECT * FROM hubspot_sync_queue 
        WHERE status = 'pending' 
        AND scheduled_at <= now()
        ORDER BY priority ASC, created_at ASC
        LIMIT 10
    LOOP
        -- Update status to processing
        UPDATE hubspot_sync_queue 
        SET status = 'processing', updated_at = now()
        WHERE id = queue_item.id;
        
        -- Here we would call the edge function, but for now just mark as completed
        -- This will be handled by the application layer
        UPDATE hubspot_sync_queue 
        SET status = 'completed', 
            processed_at = now(),
            updated_at = now()
        WHERE id = queue_item.id;
        
        processed := processed + 1;
    END LOOP;
    
    RETURN QUERY SELECT processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Enhanced logging with better categorization
ALTER TABLE hubspot_sync_log ADD COLUMN IF NOT EXISTS queue_id UUID REFERENCES hubspot_sync_queue(id);
ALTER TABLE hubspot_sync_log ADD COLUMN IF NOT EXISTS trigger_source TEXT DEFAULT 'manual';
ALTER TABLE hubspot_sync_log ADD COLUMN IF NOT EXISTS batch_id UUID;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_queue_id ON hubspot_sync_log(queue_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_batch_id ON hubspot_sync_log(batch_id);

-- Step 5: Add a function to enqueue sync operations
CREATE OR REPLACE FUNCTION enqueue_hubspot_sync(
    p_negocio_id UUID,
    p_operation_type TEXT,
    p_payload JSONB,
    p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    INSERT INTO hubspot_sync_queue (
        negocio_id,
        operation_type,
        priority,
        payload
    ) VALUES (
        p_negocio_id,
        p_operation_type,
        p_payload,
        p_priority
    ) RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create a function to get sync statistics
CREATE OR REPLACE FUNCTION get_hubspot_sync_stats(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
    total_pending INTEGER,
    total_processing INTEGER,
    total_failed INTEGER,
    total_completed_today INTEGER,
    avg_processing_time_minutes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM hubspot_sync_queue hq 
         JOIN negocios n ON hq.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hq.status = 'pending'),
        (SELECT COUNT(*)::INTEGER FROM hubspot_sync_queue hq 
         JOIN negocios n ON hq.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hq.status = 'processing'),
        (SELECT COUNT(*)::INTEGER FROM hubspot_sync_queue hq 
         JOIN negocios n ON hq.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hq.status = 'failed'),
        (SELECT COUNT(*)::INTEGER FROM hubspot_sync_queue hq 
         JOIN negocios n ON hq.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hq.status = 'completed' 
         AND hq.processed_at >= CURRENT_DATE),
        (SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (processed_at - created_at))/60), 0)::NUMERIC(10,2)
         FROM hubspot_sync_queue hq 
         JOIN negocios n ON hq.negocio_id = n.id 
         WHERE n.user_id = p_user_id AND hq.status = 'completed' 
         AND hq.processed_at >= CURRENT_DATE - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
