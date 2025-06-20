
-- Crear tabla de líneas de producto
CREATE TABLE public.lineas_producto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para lineas_producto
CREATE TRIGGER update_lineas_producto_updated_at 
  BEFORE UPDATE ON public.lineas_producto 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agregar columna linea_producto_id a productos_biblioteca
ALTER TABLE public.productos_biblioteca 
ADD COLUMN linea_producto_id UUID REFERENCES public.lineas_producto(id);

-- Crear trigger para productos_biblioteca
CREATE TRIGGER update_productos_biblioteca_updated_at 
  BEFORE UPDATE ON public.productos_biblioteca 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Crear líneas de producto por defecto basadas en categorías existentes
INSERT INTO public.lineas_producto (nombre, descripcion, activo, orden)
VALUES 
  ('Acreditación', 'Soluciones de acreditación digital y presencial', true, 1),
  ('Confirmación', 'Sistemas de confirmación automatizada', true, 2),
  ('Desarrollo', 'Soluciones de desarrollo personalizado', true, 3),
  ('Reportes', 'Herramientas de análisis y reportería', true, 4),
  ('General', 'Productos y servicios generales', true, 5);

-- Actualizar productos existentes con sus líneas correspondientes
UPDATE public.productos_biblioteca 
SET linea_producto_id = (
  SELECT id FROM public.lineas_producto 
  WHERE nombre = 'Acreditación'
) 
WHERE categoria = 'Acreditación';

UPDATE public.productos_biblioteca 
SET linea_producto_id = (
  SELECT id FROM public.lineas_producto 
  WHERE nombre = 'Confirmación'
) 
WHERE categoria = 'Confirmación';

UPDATE public.productos_biblioteca 
SET linea_producto_id = (
  SELECT id FROM public.lineas_producto 
  WHERE nombre = 'Desarrollo'
) 
WHERE categoria = 'Desarrollo';

UPDATE public.productos_biblioteca 
SET linea_producto_id = (
  SELECT id FROM public.lineas_producto 
  WHERE nombre = 'Reportes'
) 
WHERE categoria = 'Reportes';

-- Asignar productos sin categoría a General
UPDATE public.productos_biblioteca 
SET linea_producto_id = (
  SELECT id FROM public.lineas_producto 
  WHERE nombre = 'General'
) 
WHERE categoria IS NULL OR categoria = 'General';

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_productos_biblioteca_linea_producto_id 
ON public.productos_biblioteca(linea_producto_id);

CREATE INDEX idx_lineas_producto_activo 
ON public.lineas_producto(activo);

CREATE INDEX idx_lineas_producto_orden 
ON public.lineas_producto(orden);
