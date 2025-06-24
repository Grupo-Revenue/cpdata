
-- Add fecha_cierre column to negocios table
ALTER TABLE public.negocios 
ADD COLUMN fecha_cierre date;

-- Add comment to document the field
COMMENT ON COLUMN public.negocios.fecha_cierre IS 'Expected close date of the deal, synced with HubSpot closedate property';
