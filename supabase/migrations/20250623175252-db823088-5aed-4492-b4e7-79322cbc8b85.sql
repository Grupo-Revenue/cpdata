
-- Create table for mapping business states to HubSpot deal stages
CREATE TABLE public.hubspot_state_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_state TEXT NOT NULL,
  hubspot_pipeline_id TEXT NOT NULL,
  hubspot_stage_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_state, hubspot_pipeline_id)
);

-- Enable RLS
ALTER TABLE public.hubspot_state_mapping ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own state mappings" 
  ON public.hubspot_state_mapping 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own state mappings" 
  ON public.hubspot_state_mapping 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own state mappings" 
  ON public.hubspot_state_mapping 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own state mappings" 
  ON public.hubspot_state_mapping 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_hubspot_state_mapping_updated_at
  BEFORE UPDATE ON public.hubspot_state_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for tracking bidirectional sync operations
CREATE TABLE public.hubspot_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  hubspot_deal_id TEXT,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('app_to_hubspot', 'hubspot_to_app', 'conflict_resolution')),
  old_state TEXT,
  new_state TEXT,
  hubspot_old_stage TEXT,
  hubspot_new_stage TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  conflict_resolved BOOLEAN DEFAULT false,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('outbound', 'inbound', 'bidirectional')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hubspot_sync_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sync logs" 
  ON public.hubspot_sync_log 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.negocios n 
      WHERE n.id = hubspot_sync_log.negocio_id 
      AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sync logs" 
  ON public.hubspot_sync_log 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.negocios n 
      WHERE n.id = hubspot_sync_log.negocio_id 
      AND n.user_id = auth.uid()
    )
  );

-- Create table for webhook security and tracking
CREATE TABLE public.hubspot_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_secret TEXT NOT NULL,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.hubspot_webhooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own webhook config" 
  ON public.hubspot_webhooks 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own webhook config" 
  ON public.hubspot_webhooks 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own webhook config" 
  ON public.hubspot_webhooks 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_hubspot_webhooks_updated_at
  BEFORE UPDATE ON public.hubspot_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to hubspot_config for bidirectional sync settings
ALTER TABLE public.hubspot_config 
ADD COLUMN bidirectional_sync BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN webhook_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN conflict_resolution_strategy TEXT NOT NULL DEFAULT 'manual' CHECK (conflict_resolution_strategy IN ('manual', 'hubspot_wins', 'app_wins', 'most_recent')),
ADD COLUMN polling_interval_minutes INTEGER NOT NULL DEFAULT 30,
ADD COLUMN last_poll_at TIMESTAMP WITH TIME ZONE;

-- Add new columns to hubspot_sync for bidirectional tracking
ALTER TABLE public.hubspot_sync
ADD COLUMN last_hubspot_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN hubspot_last_modified TIMESTAMP WITH TIME ZONE,
ADD COLUMN app_last_modified TIMESTAMP WITH TIME ZONE,
ADD COLUMN sync_conflicts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_conflict_at TIMESTAMP WITH TIME ZONE;
