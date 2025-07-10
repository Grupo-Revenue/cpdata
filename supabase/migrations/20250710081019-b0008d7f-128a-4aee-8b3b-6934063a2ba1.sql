-- Fix the trigger to remove net.http_post dependency
CREATE OR REPLACE FUNCTION trigger_hubspot_sync_on_estado_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if estado changed and it's a significant change
    IF TG_OP = 'UPDATE' AND OLD.estado != NEW.estado AND NEW.hubspot_id IS NOT NULL THEN
        -- Log the state change only (remove the net.http_post call)
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
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;