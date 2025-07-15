-- Habilitar RLS en la tabla lineas_producto
ALTER TABLE public.lineas_producto ENABLE ROW LEVEL SECURITY;

-- Política para que todos los usuarios autenticados puedan ver líneas activas
CREATE POLICY "Users can view active product lines" 
ON public.lineas_producto 
FOR SELECT 
TO authenticated
USING (activo = true);

-- Política para que los administradores puedan ver todas las líneas (activas e inactivas)
CREATE POLICY "Admins can view all product lines" 
ON public.lineas_producto 
FOR SELECT 
TO authenticated
USING (is_admin());

-- Políticas de administración para admins solamente
CREATE POLICY "Admins can insert product lines" 
ON public.lineas_producto 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update product lines" 
ON public.lineas_producto 
FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete product lines" 
ON public.lineas_producto 
FOR DELETE 
TO authenticated
USING (is_admin());