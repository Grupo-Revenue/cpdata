-- Limpiar registros existentes en configuracion_marca
DELETE FROM public.configuracion_marca;

-- Insertar un solo registro con la configuración correcta usando el nuevo logo
INSERT INTO public.configuracion_marca (
  nombre_empresa,
  telefono,
  email,
  sitio_web,
  direccion,
  color_primario,
  color_secundario,
  logo_url
) VALUES (
  'CP Data',
  '+56 9 1234 5678',
  'contacto@cpdata.cl',
  'www.cpdata.cl',
  'Santiago, Chile',
  '#3B82F6',
  '#1E40AF',
  '/lovable-uploads/3c2b46dc-6a80-456c-846c-8f351ae4acd7.png'
);