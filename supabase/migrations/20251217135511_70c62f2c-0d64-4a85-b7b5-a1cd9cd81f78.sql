-- Agregar columna fecha_evento_fin a la tabla negocios
ALTER TABLE public.negocios 
ADD COLUMN fecha_evento_fin date;

-- Agregar comentario descriptivo
COMMENT ON COLUMN public.negocios.fecha_evento_fin IS 'Fecha de fin del evento';