UPDATE public.configuracion_marca 
SET logo_url = '/lovable-uploads/11f038e0-cd56-407b-bf1b-584d1c6d2603.png',
    updated_at = now()
WHERE id IS NOT NULL;