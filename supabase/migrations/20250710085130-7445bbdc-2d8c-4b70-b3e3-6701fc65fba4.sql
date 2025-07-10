-- Remove problematic triggers that create pending logs
DROP TRIGGER IF EXISTS negocios_hubspot_sync ON negocios;

-- Drop the trigger function that creates unnecessary pending logs
DROP FUNCTION IF EXISTS trigger_hubspot_sync_on_estado_change();

-- Clean up existing pending sync logs to avoid confusion
DELETE FROM hubspot_sync_log WHERE status = 'pending';

-- Create a comment to explain the change
COMMENT ON TABLE hubspot_sync_log IS 'HubSpot sync operations are now handled directly from frontend via edge functions, not through database triggers';