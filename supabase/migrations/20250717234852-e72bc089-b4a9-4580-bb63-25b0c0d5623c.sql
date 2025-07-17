-- Corregir políticas RLS para presupuestos - restringir por propiedad del negocio

-- Eliminar las políticas actuales que son demasiado permisivas
DROP POLICY IF EXISTS "Authenticated users can update budgets globally" ON public.presupuestos;
DROP POLICY IF EXISTS "Authenticated users can delete budgets globally" ON public.presupuestos;

-- Crear nuevas políticas que restringen por propiedad del negocio
CREATE POLICY "Users can update budgets of their own businesses" 
ON public.presupuestos 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  negocio_id IN (
    SELECT id FROM public.negocios WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  negocio_id IN (
    SELECT id FROM public.negocios WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete budgets of their own businesses" 
ON public.presupuestos 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  negocio_id IN (
    SELECT id FROM public.negocios WHERE user_id = auth.uid()
  )
);

-- Mantener políticas de administrador intactas
-- (Las políticas de admin ya existen y tienen prioridad)