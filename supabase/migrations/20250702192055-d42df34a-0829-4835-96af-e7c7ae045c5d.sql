-- Remove all HubSpot related tables and functions
DROP TABLE IF EXISTS public.hubspot_sync_conflicts CASCADE;
DROP TABLE IF EXISTS public.hubspot_sync_log CASCADE;
DROP TABLE IF EXISTS public.hubspot_sync_queue CASCADE;
DROP TABLE IF EXISTS public.hubspot_sync CASCADE;
DROP TABLE IF EXISTS public.hubspot_state_mapping CASCADE;
DROP TABLE IF EXISTS public.hubspot_webhooks CASCADE;
DROP TABLE IF EXISTS public.hubspot_config CASCADE;
DROP TABLE IF EXISTS public.hubspot_api_keys CASCADE;

-- Remove HubSpot related functions
DROP FUNCTION IF EXISTS public.create_hubspot_keys_table_if_not_exists() CASCADE;
DROP FUNCTION IF EXISTS public.notify_hubspot_sync() CASCADE;
DROP FUNCTION IF EXISTS public.process_hubspot_sync_queue() CASCADE;
DROP FUNCTION IF EXISTS public.enqueue_hubspot_sync(uuid, text, jsonb, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_hubspot_sync_stats(uuid) CASCADE;