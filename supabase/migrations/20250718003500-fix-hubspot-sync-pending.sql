
-- Limpiar registros de sincronización pendientes que están atorados
-- Marcar como fallidos los registros pendientes antiguos (más de 1 hora)
UPDATE hubspot_sync_log 
SET status = 'failed',
    error_message = 'Expired pending record - marked as failed for retry',
    processed_at = now(),
    updated_at = now()
WHERE status IN ('pending', 'pending_confirmation') 
AND created_at < now() - INTERVAL '1 hour';

-- Comentario explicativo
COMMENT ON TABLE hubspot_sync_log IS 'HubSpot sync operations - expired pending records have been marked as failed for proper retry handling';
