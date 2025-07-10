-- Add better indexes for HubSpot connections to improve performance across environments
CREATE INDEX IF NOT EXISTS idx_hubspot_api_keys_user_active ON hubspot_api_keys(user_id, activo) WHERE activo = true;

-- Add function to get global active HubSpot token (for debugging)
CREATE OR REPLACE FUNCTION public.get_global_hubspot_token()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  created_at timestamp with time zone,
  activo boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, user_id, created_at, activo
  FROM public.hubspot_api_keys
  WHERE activo = true
  ORDER BY created_at DESC
  LIMIT 1;
$$;