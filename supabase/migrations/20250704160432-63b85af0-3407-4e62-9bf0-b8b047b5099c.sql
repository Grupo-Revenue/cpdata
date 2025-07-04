
-- Crear tabla para almacenar los tokens de API de HubSpot
CREATE TABLE public.hubspot_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar Row Level Security
ALTER TABLE public.hubspot_api_keys ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios tokens
CREATE POLICY "Users can view their own HubSpot API keys" 
  ON public.hubspot_api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propios tokens
CREATE POLICY "Users can create their own HubSpot API keys" 
  ON public.hubspot_api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propios tokens
CREATE POLICY "Users can update their own HubSpot API keys" 
  ON public.hubspot_api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios tokens
CREATE POLICY "Users can delete their own HubSpot API keys" 
  ON public.hubspot_api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_hubspot_api_keys_updated_at
  BEFORE UPDATE ON public.hubspot_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
