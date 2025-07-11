-- Crear función para sincronizar cambios de estado de negocio con HubSpot
CREATE OR REPLACE FUNCTION trigger_hubspot_sync_negocio_estado()
RETURNS TRIGGER AS $$
DECLARE
    sync_log_id UUID;
BEGIN
    -- Solo sincronizar si:
    -- 1. Es una actualización (no inserción o eliminación)
    -- 2. El estado realmente cambió
    -- 3. El negocio tiene hubspot_id configurado
    IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado AND NEW.hubspot_id IS NOT NULL THEN
        
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
        
        -- Llamar a la Edge Function usando pg_net
        BEGIN
            PERFORM
                net.http_post(
                    url := 'https://ejvtuuvigcqpibpfcxch.supabase.co/functions/v1/hubspot-deal-update',
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnR1dXZpZ2NxcGlicGZjeGNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODQzMSwiZXhwIjoyMDY1OTU0NDMxfQ.u5kUfOa1Lw2qzmbFhQ0YhD1Qe_VwAGDgDa_oBTa7ZQ0'
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
$$ LANGUAGE plpgsql;

-- Crear el trigger en la tabla negocios
DROP TRIGGER IF EXISTS trigger_hubspot_sync_on_estado_change ON public.negocios;
CREATE TRIGGER trigger_hubspot_sync_on_estado_change
    AFTER UPDATE ON public.negocios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_hubspot_sync_negocio_estado();

-- Comentario explicativo
COMMENT ON FUNCTION trigger_hubspot_sync_negocio_estado() IS 'Sincroniza automáticamente con HubSpot cuando cambia el estado de un negocio';