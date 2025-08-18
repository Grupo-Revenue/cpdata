-- Corregir el trigger de sincronización HubSpot para usar valores válidos de status
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
                
                -- Actualizar el log como pendiente de confirmación
                UPDATE hubspot_sync_log 
                SET status = 'pending_confirmation',
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

-- Limpiar registros acumulados antiguos (más de 24 horas) que están pendientes
DELETE FROM hubspot_sync_log 
WHERE status IN ('pending', 'pending_confirmation') 
AND created_at < now() - INTERVAL '24 hours';

-- Actualizar registros pendientes recientes a fallidos para evitar acumulación
UPDATE hubspot_sync_log 
SET status = 'failed',
    error_message = 'Cleaned up old pending record',
    processed_at = now()
WHERE status IN ('pending', 'pending_confirmation') 
AND created_at < now() - INTERVAL '1 hour';

-- Verificar que el service role key esté configurado
INSERT INTO system_config (config_key, config_value, encrypted)
VALUES ('supabase_service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnR1dXZpZ2NxcGlicGZjeGNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODQzMSwiZXhwIjoyMDY1OTU0NDMxfQ.6JKl3GqD4wIfWgcwZGgKZLKN9vn-0S9Z36XOlbkNnvg', true)
ON CONFLICT (config_key) 
DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = now();

-- Verificar que el constraint de status sea correcto
ALTER TABLE hubspot_sync_log 
DROP CONSTRAINT IF EXISTS hubspot_sync_log_status_check;

ALTER TABLE hubspot_sync_log 
ADD CONSTRAINT hubspot_sync_log_status_check 
CHECK (status IN ('pending', 'pending_confirmation', 'success', 'failed', 'retrying', 'processed_manually'));