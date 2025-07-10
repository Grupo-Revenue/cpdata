-- Check and create unique constraints for HubSpot IDs if they don't exist

-- For contactos table (should already exist but let's verify)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_contactos_hubspot_id'
    ) THEN
        ALTER TABLE public.contactos 
        ADD CONSTRAINT unique_contactos_hubspot_id UNIQUE (hubspot_id);
    END IF;
END $$;

-- For empresas table (may not exist yet)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_empresas_hubspot_id'
    ) THEN
        ALTER TABLE public.empresas 
        ADD CONSTRAINT unique_empresas_hubspot_id UNIQUE (hubspot_id);
    END IF;
END $$;

-- For negocios table (may not exist yet)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_negocios_hubspot_id'
    ) THEN
        ALTER TABLE public.negocios 
        ADD CONSTRAINT unique_negocios_hubspot_id UNIQUE (hubspot_id);
    END IF;
END $$;