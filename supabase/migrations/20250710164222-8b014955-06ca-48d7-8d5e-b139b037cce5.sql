-- Crear función para token global de HubSpot
-- Esta migración permite que todos los usuarios compartan el mismo token

-- Primero, eliminar el índice único que requiere user_id
DROP INDEX IF EXISTS idx_hubspot_api_keys_user_active;

-- Crear nuevo índice para permitir solo un token activo globalmente
CREATE UNIQUE INDEX idx_hubspot_api_keys_global_active 
ON public.hubspot_api_keys (activo) 
WHERE activo = true;

-- Actualizar políticas RLS para permitir acceso global a tokens activos
DROP POLICY IF EXISTS "Users can view their own hubspot api keys" ON public.hubspot_api_keys;
DROP POLICY IF EXISTS "Users can insert their own hubspot api keys" ON public.hubspot_api_keys;
DROP POLICY IF EXISTS "Users can update their own hubspot api keys" ON public.hubspot_api_keys;
DROP POLICY IF EXISTS "Users can delete their own hubspot api keys" ON public.hubspot_api_keys;

-- Nuevas políticas para token global
CREATE POLICY "Authenticated users can view active hubspot tokens" 
  ON public.hubspot_api_keys 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND activo = true);

CREATE POLICY "Authenticated users can insert hubspot tokens" 
  ON public.hubspot_api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update hubspot tokens" 
  ON public.hubspot_api_keys 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete hubspot tokens" 
  ON public.hubspot_api_keys 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);