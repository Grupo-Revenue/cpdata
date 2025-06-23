
-- Create table to track HubSpot synchronization
CREATE TABLE public.hubspot_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  hubspot_deal_id TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(negocio_id)
);

-- Enable RLS
ALTER TABLE public.hubspot_sync ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own hubspot sync records" 
  ON public.hubspot_sync 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.negocios n 
      WHERE n.id = hubspot_sync.negocio_id 
      AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own hubspot sync records" 
  ON public.hubspot_sync 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.negocios n 
      WHERE n.id = hubspot_sync.negocio_id 
      AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own hubspot sync records" 
  ON public.hubspot_sync 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.negocios n 
      WHERE n.id = hubspot_sync.negocio_id 
      AND n.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_hubspot_sync_updated_at
  BEFORE UPDATE ON public.hubspot_sync
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for HubSpot configuration per user
CREATE TABLE public.hubspot_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_set BOOLEAN NOT NULL DEFAULT false,
  auto_sync BOOLEAN NOT NULL DEFAULT true,
  default_pipeline_id TEXT,
  default_deal_stage TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.hubspot_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own hubspot config" 
  ON public.hubspot_config 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own hubspot config" 
  ON public.hubspot_config 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own hubspot config" 
  ON public.hubspot_config 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_hubspot_config_updated_at
  BEFORE UPDATE ON public.hubspot_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
