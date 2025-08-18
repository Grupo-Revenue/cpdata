-- Limpiar registros de sync pendientes muy antiguos (más de 24 horas)
UPDATE hubspot_sync_log 
SET status = 'expired',
    error_message = 'Record expired after 24 hours',
    processed_at = now()
WHERE status IN ('pending', 'pending_confirmation') 
AND created_at < now() - INTERVAL '24 hours';

-- Reintentar registros que quedaron en pending_confirmation hace más de 1 hora
UPDATE hubspot_sync_log 
SET status = 'pending',
    retry_count = retry_count + 1,
    updated_at = now()
WHERE status = 'pending_confirmation' 
AND updated_at < now() - INTERVAL '1 hour'
AND retry_count < max_retries;