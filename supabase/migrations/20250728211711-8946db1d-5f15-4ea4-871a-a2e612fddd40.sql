-- Actualizar la URL del logo en la configuración de marca
UPDATE public.configuracion_marca 
SET logo_url = 'https://www.cpdata.cl/wp-content/uploads/2021/09/logo_cpdata-chico-chico.png',
    updated_at = now()
WHERE nombre_empresa = 'CP Data' OR id IN (SELECT id FROM public.configuracion_marca LIMIT 1);