
-- Agregar columnas faltantes para el logging de montos
ALTER TABLE public.hubspot_sync_log 
ADD COLUMN IF NOT EXISTS old_amount numeric,
ADD COLUMN IF NOT EXISTS new_amount numeric;

-- Crear índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_negocio_id ON public.hubspot_sync_log(negocio_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_created_at ON public.hubspot_sync_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_operation_type ON public.hubspot_sync_log(operation_type);

-- Crear índice para mejorar las consultas de sincronización
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_negocio_id ON public.hubspot_sync(negocio_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_hubspot_deal_id ON public.hubspot_sync(hubspot_deal_id);
