-- Verificar y eliminar cualquier trigger restante relacionado con HubSpot
DROP TRIGGER IF EXISTS negocios_hubspot_sync ON negocios;
DROP TRIGGER IF EXISTS trigger_hubspot_sync_on_negocio_update ON negocios;

-- Eliminar cualquier función relacionada con triggers HubSpot que pueda estar causando problemas
DROP FUNCTION IF EXISTS trigger_hubspot_sync_on_estado_change();
DROP FUNCTION IF EXISTS trigger_hubspot_sync_on_negocio_update();

-- Limpiar TODOS los logs pending y failed de HubSpot para empezar limpio
DELETE FROM hubspot_sync_log WHERE status IN ('pending', 'failed', 'retrying');

-- Agregar comentario para explicar el cambio
COMMENT ON TABLE hubspot_sync_log IS 'HubSpot sync operations are now handled exclusively from frontend via direct API calls, not through database triggers or edge functions';

-- Verificar que no queden triggers activos en la tabla negocios
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'negocios' 
AND trigger_schema = 'public';