-- Habilitar las extensiones necesarias para HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Actualizar el constraint de status para incluir 'pending_confirmation'
ALTER TABLE hubspot_sync_log DROP CONSTRAINT IF EXISTS hubspot_sync_log_status_check;
ALTER TABLE hubspot_sync_log ADD CONSTRAINT hubspot_sync_log_status_check 
CHECK (status IN ('pending', 'success', 'failed', 'retrying', 'pending_confirmation'));

-- Asegurar que el trigger esté activo en la tabla negocios
DROP TRIGGER IF EXISTS trigger_hubspot_sync_on_estado_change ON public.negocios;
CREATE TRIGGER trigger_hubspot_sync_on_estado_change
    AFTER UPDATE ON public.negocios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_hubspot_sync_negocio_estado();

-- Comentario explicativo
COMMENT ON FUNCTION trigger_hubspot_sync_negocio_estado() IS 'Trigger que sincroniza automáticamente con HubSpot cuando cambia el estado de un negocio. Usa pg_net para llamadas HTTP y maneja errores apropiadamente';