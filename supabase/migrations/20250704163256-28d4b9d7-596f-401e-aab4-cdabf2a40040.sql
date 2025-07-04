
-- Agregar columna 'activo' a la tabla hubspot_api_keys
ALTER TABLE public.hubspot_api_keys 
ADD COLUMN activo BOOLEAN NOT NULL DEFAULT false;

-- Crear un índice único para garantizar que solo haya un token activo por usuario
CREATE UNIQUE INDEX idx_hubspot_api_keys_user_active 
ON public.hubspot_api_keys (user_id) 
WHERE activo = true;
