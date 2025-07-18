-- Eliminar políticas restrictivas para negocios
DROP POLICY IF EXISTS "Users can update their own businesses" ON public.negocios;
DROP POLICY IF EXISTS "Users can delete their own businesses" ON public.negocios;

-- Eliminar políticas restrictivas para presupuestos
DROP POLICY IF EXISTS "Users can update budgets of their own businesses" ON public.presupuestos;
DROP POLICY IF EXISTS "Users can delete budgets of their own businesses" ON public.presupuestos;

-- Crear nuevas políticas permisivas para negocios
CREATE POLICY "Authenticated users can update all businesses" 
ON public.negocios 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all businesses" 
ON public.negocios 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Crear nuevas políticas permisivas para presupuestos  
CREATE POLICY "Authenticated users can update all budgets" 
ON public.presupuestos 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all budgets" 
ON public.presupuestos 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);