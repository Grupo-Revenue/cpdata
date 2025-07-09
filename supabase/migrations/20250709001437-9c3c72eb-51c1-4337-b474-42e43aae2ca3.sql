-- Add hubspot_id field to contactos table
ALTER TABLE public.contactos 
ADD COLUMN hubspot_id TEXT NULL;

-- Add hubspot_id field to empresas table  
ALTER TABLE public.empresas 
ADD COLUMN hubspot_id TEXT NULL;

-- Add hubspot_id field to negocios table
ALTER TABLE public.negocios 
ADD COLUMN hubspot_id TEXT NULL;

-- Add indexes for better performance when searching by hubspot_id
CREATE INDEX idx_contactos_hubspot_id ON public.contactos(hubspot_id) WHERE hubspot_id IS NOT NULL;
CREATE INDEX idx_empresas_hubspot_id ON public.empresas(hubspot_id) WHERE hubspot_id IS NOT NULL;
CREATE INDEX idx_negocios_hubspot_id ON public.negocios(hubspot_id) WHERE hubspot_id IS NOT NULL;

-- Add unique constraints to prevent duplicates
ALTER TABLE public.contactos ADD CONSTRAINT unique_contactos_hubspot_id UNIQUE (hubspot_id);
ALTER TABLE public.empresas ADD CONSTRAINT unique_empresas_hubspot_id UNIQUE (hubspot_id);
ALTER TABLE public.negocios ADD CONSTRAINT unique_negocios_hubspot_id UNIQUE (hubspot_id);