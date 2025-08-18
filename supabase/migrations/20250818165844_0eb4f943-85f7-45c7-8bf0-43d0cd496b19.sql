-- Verificar y crear mapeo de estados faltantes
INSERT INTO hubspot_stage_mapping (user_id, estado_negocio, stage_id)
VALUES 
  ((SELECT id FROM auth.users LIMIT 1), 'oportunidad_creada', 'appointmentscheduled'),
  ((SELECT id FROM auth.users LIMIT 1), 'presupuesto_enviado', 'qualifiedtobuy'),
  ((SELECT id FROM auth.users LIMIT 1), 'negocio_aceptado', 'decisionmakerboughtin'),
  ((SELECT id FROM auth.users LIMIT 1), 'parcialmente_aceptado', 'contractsent'),
  ((SELECT id FROM auth.users LIMIT 1), 'negocio_cerrado', 'closedwon'),
  ((SELECT id FROM auth.users LIMIT 1), 'negocio_perdido', 'closedlost')
ON CONFLICT (user_id, estado_negocio) DO NOTHING;

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