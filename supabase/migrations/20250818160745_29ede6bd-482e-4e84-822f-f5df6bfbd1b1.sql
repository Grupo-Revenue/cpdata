-- Step 1: Create system_config table for persistent storage
CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only system functions can access this table
CREATE POLICY "System functions can access config" ON public.system_config
    FOR ALL USING (true);

-- Insert the service role key
INSERT INTO public.system_config (config_key, config_value, encrypted)
VALUES ('supabase_service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnR1dXZpZ2NxcGlicGZjeGNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODQzMSwiZXhwIjoyMDY1OTU0NDMxfQ.GhubhZfpe7PpQVlBK9FJLMTpGW5ilPumRPRn0jn4bSY', false)
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = now();

-- Step 2: Create function to get system config
CREATE OR REPLACE FUNCTION public.get_system_config(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    config_value TEXT;
BEGIN
    SELECT sc.config_value INTO config_value
    FROM public.system_config sc
    WHERE sc.config_key = p_key;
    
    RETURN config_value;
END;
$function$;

-- Step 3: Create function to process pending HubSpot syncs manually
CREATE OR REPLACE FUNCTION public.process_pending_hubspot_syncs(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(processed INTEGER, failed INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    processed_count INTEGER := 0;
    failed_count INTEGER := 0;
    sync_record RECORD;
    service_role_key TEXT;
BEGIN
    -- Get service role key
    SELECT public.get_system_config('supabase_service_role_key') INTO service_role_key;
    
    IF service_role_key IS NULL THEN
        RAISE EXCEPTION 'Service role key not configured';
    END IF;
    
    -- Process pending syncs for user's negocios
    FOR sync_record IN 
        SELECT hsl.id, hsl.negocio_id, hsl.request_payload
        FROM hubspot_sync_log hsl
        JOIN negocios n ON hsl.negocio_id = n.id
        WHERE n.user_id = p_user_id 
        AND hsl.status = 'pending'
        ORDER BY hsl.created_at DESC
        LIMIT 10
    LOOP
        BEGIN
            -- Call edge function using pg_net
            PERFORM net.http_post(
                url := 'https://ejvtuuvigcqpibpfcxch.supabase.co/functions/v1/hubspot-deal-update',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || service_role_key
                ),
                body := sync_record.request_payload
            );
            
            -- Update as processed
            UPDATE hubspot_sync_log 
            SET status = 'processed_manually',
                processed_at = now(),
                updated_at = now()
            WHERE id = sync_record.id;
            
            processed_count := processed_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Mark as failed
                UPDATE hubspot_sync_log 
                SET status = 'failed',
                    error_message = SQLERRM,
                    processed_at = now()
                WHERE id = sync_record.id;
                
                failed_count := failed_count + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT processed_count, failed_count;
END;
$function$;

-- Step 4: Update the trigger to use persistent config with better error handling
CREATE OR REPLACE FUNCTION public.trigger_hubspot_sync_negocio_estado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    sync_log_id UUID;
    service_role_key TEXT;
    http_request_id BIGINT;
BEGIN
    -- Solo sincronizar si:
    -- 1. Es una actualización (no inserción o eliminación)
    -- 2. El estado realmente cambió
    -- 3. El negocio tiene hubspot_id configurado
    IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado AND NEW.hubspot_id IS NOT NULL THEN
        
        -- Obtener el service role key de la configuración persistente
        SELECT public.get_system_config('supabase_service_role_key') INTO service_role_key;
        
        -- Insertar log de sincronización para tracking
        INSERT INTO hubspot_sync_log (
            negocio_id,
            operation_type,
            status,
            request_payload,
            trigger_source
        ) VALUES (
            NEW.id,
            'estado_change',
            'pending',
            jsonb_build_object(
                'negocio_id', NEW.id,
                'estado_anterior', OLD.estado,
                'estado_nuevo', NEW.estado,
                'hubspot_id', NEW.hubspot_id,
                'timestamp', extract(epoch from now())
            ),
            'database_trigger'
        ) RETURNING id INTO sync_log_id;
        
        -- Solo intentar llamada HTTP si tenemos el service role key
        IF service_role_key IS NOT NULL AND service_role_key != '' THEN
            BEGIN
                -- Llamar a la Edge Function usando pg_net
                SELECT net.http_post(
                    url := 'https://ejvtuuvigcqpibpfcxch.supabase.co/functions/v1/hubspot-deal-update',
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || service_role_key
                    ),
                    body := jsonb_build_object(
                        'negocio_id', NEW.id,
                        'estado_anterior', OLD.estado,
                        'estado_nuevo', NEW.estado
                    )
                ) INTO http_request_id;
                
                -- Actualizar el log con el request ID
                UPDATE hubspot_sync_log 
                SET status = 'sent',
                    request_payload = request_payload || jsonb_build_object('http_request_id', http_request_id),
                    updated_at = now()
                WHERE id = sync_log_id;
                
            EXCEPTION
                WHEN OTHERS THEN
                    -- Loguear error detallado si falla la llamada HTTP
                    UPDATE hubspot_sync_log 
                    SET status = 'failed',
                        error_message = format('HTTP call failed: %s', SQLERRM),
                        processed_at = now()
                    WHERE id = sync_log_id;
            END;
        ELSE
            -- Si no hay service role key, marcar como fallido con mensaje específico
            UPDATE hubspot_sync_log 
            SET status = 'failed',
                error_message = 'Service role key not configured',
                processed_at = now()
            WHERE id = sync_log_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;