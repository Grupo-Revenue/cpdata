-- Create trigger to automatically sync HubSpot when negocio estado changes
CREATE OR REPLACE FUNCTION trigger_hubspot_sync_on_estado_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if estado changed and it's a significant change
    IF TG_OP = 'UPDATE' AND OLD.estado != NEW.estado AND NEW.hubspot_id IS NOT NULL THEN
        -- Log the state change
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

        -- Call the hubspot-deal-update edge function directly
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS negocios_hubspot_sync ON negocios;

-- Create the new trigger
CREATE TRIGGER negocios_hubspot_sync
    AFTER UPDATE ON negocios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_hubspot_sync_on_estado_change();