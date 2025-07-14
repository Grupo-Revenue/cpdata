-- Add missing columns to public_budget_links table
ALTER TABLE public.public_budget_links 
ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS hubspot_property TEXT;