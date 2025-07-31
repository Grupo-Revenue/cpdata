-- Create tipos_evento table
CREATE TABLE public.tipos_evento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tipos_evento ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Solo admins pueden insertar tipos de evento" 
ON public.tipos_evento 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Solo admins pueden actualizar tipos de evento" 
ON public.tipos_evento 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Solo admins pueden eliminar tipos de evento" 
ON public.tipos_evento 
FOR DELETE 
USING (is_admin());

CREATE POLICY "Admins pueden ver todos los tipos de evento" 
ON public.tipos_evento 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Usuarios pueden ver tipos de evento activos" 
ON public.tipos_evento 
FOR SELECT 
USING (activo = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tipos_evento_updated_at
  BEFORE UPDATE ON public.tipos_evento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing event types from the hardcoded array
INSERT INTO public.tipos_evento (nombre, orden) VALUES
  ('Congreso', 1),
  ('Seminario', 2),
  ('Workshop', 3),
  ('Conferencia', 4),
  ('Feria Comercial', 5),
  ('Lanzamiento de Producto', 6),
  ('Evento Corporativo', 7),
  ('Capacitación', 8),
  ('Evento Deportivo', 9),
  ('Evento Cultural', 10),
  ('Evento Benéfico', 11),
  ('Networking', 12),
  ('Otro', 13);