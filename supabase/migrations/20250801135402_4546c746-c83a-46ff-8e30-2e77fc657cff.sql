-- Update the brand configuration to use the local Supabase Storage logo path
UPDATE public.configuracion_marca 
SET logo_url = 'logo.png',
    updated_at = now()
WHERE id = (SELECT id FROM public.configuracion_marca LIMIT 1);