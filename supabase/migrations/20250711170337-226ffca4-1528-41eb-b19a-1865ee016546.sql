-- Habilitar las extensiones necesarias para HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Asegurar que el trigger esté activo en la tabla presupuestos
DROP TRIGGER IF EXISTS trigger_actualizar_estado_negocio_presupuestos ON public.presupuestos;
CREATE TRIGGER trigger_actualizar_estado_negocio_presupuestos
    AFTER INSERT OR UPDATE OR DELETE ON public.presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_actualizar_estado_negocio();

-- Comentario explicativo
COMMENT ON FUNCTION public.trigger_actualizar_estado_negocio() IS 'Trigger que actualiza automáticamente el estado del negocio y sincroniza con HubSpot cuando cambian los presupuestos';