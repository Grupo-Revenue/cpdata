-- Actualizar la función trigger para usar la configuración persistente del service role key
CREATE OR REPLACE FUNCTION public.trigger_hubspot_sync_negocio_estado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    sync_log_id UUID;
    service_role_key TEXT;
BEGIN
    -- Solo sincronizar si:
    -- 1. Es una actualización (no inserción o eliminación)
    -- 2. El estado realmente cambió
    -- 3. El negocio tiene hubspot_id configurado
    IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado AND NEW.hubspot_id IS NOT NULL THEN
        
        -- Obtener el service role key de la configuración persistente
        SELECT current_setting('app.supabase_service_role_key', true) INTO service_role_key;
        
        -- Si no está configurado, intentar usar la variable de entorno
        IF service_role_key IS NULL OR service_role_key = '' THEN
            service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnR1dXZpZ2NxcGlicGZjeGNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODQzMSwiZXhwIjoyMDY1OTU0NDMxfQ.GhubhZfpe7PpQVlBK9FJLMTpGW5ilPumRPRn0jn4bSY';
        END IF;
        
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
        
        -- Llamar a la Edge Function usando pg_net con la key correcta
        BEGIN
            PERFORM
                net.http_post(
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
                );
                
            -- Actualizar el log como exitoso si no hubo errores
            UPDATE hubspot_sync_log 
            SET status = 'pending_confirmation',
                updated_at = now()
            WHERE id = sync_log_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Loguear error si falla la llamada HTTP
                UPDATE hubspot_sync_log 
                SET status = 'failed',
                    error_message = SQLERRM,
                    processed_at = now()
                WHERE id = sync_log_id;
        END;
    END IF;

    RETURN NEW;
END;
$function$;

-- Verificar que la configuración está activa
SELECT current_setting('app.supabase_service_role_key', true) as config_check;