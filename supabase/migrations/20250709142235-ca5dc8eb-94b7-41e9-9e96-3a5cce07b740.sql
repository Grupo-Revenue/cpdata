-- Crear tabla para mapeo de estados entre la aplicación y HubSpot
CREATE TABLE public.hubspot_stage_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estado_negocio estado_negocio NOT NULL,
  hubspot_pipeline_id TEXT NOT NULL,
  hubspot_stage_id TEXT NOT NULL,
  hubspot_stage_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, estado_negocio)
);

-- Enable RLS
ALTER TABLE public.hubspot_stage_mapping ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own stage mappings" 
  ON public.hubspot_stage_mapping 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own stage mappings" 
  ON public.hubspot_stage_mapping 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stage mappings" 
  ON public.hubspot_stage_mapping 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own stage mappings" 
  ON public.hubspot_stage_mapping 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_hubspot_stage_mapping_updated_at
  BEFORE UPDATE ON public.hubspot_stage_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();