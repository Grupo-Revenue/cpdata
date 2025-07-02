
-- Create table to store HubSpot API keys
CREATE TABLE public.hubspot_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.hubspot_api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own hubspot api keys" 
  ON public.hubspot_api_keys 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own hubspot api keys" 
  ON public.hubspot_api_keys 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own hubspot api keys" 
  ON public.hubspot_api_keys 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_hubspot_api_keys_updated_at
  BEFORE UPDATE ON public.hubspot_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to create the table if it doesn't exist (for backward compatibility)
CREATE OR REPLACE FUNCTION create_hubspot_keys_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function is now a no-op since the table will exist after this migration
  -- But kept for compatibility with the edge function
  RETURN;
END;
$$;
