-- Update RLS policies to allow global budget management for all authenticated users

-- Drop restrictive policies for presupuestos table
DROP POLICY IF EXISTS "Users can create budgets for their businesses" ON public.presupuestos;
DROP POLICY IF EXISTS "Users can update budgets for their businesses" ON public.presupuestos;
DROP POLICY IF EXISTS "Users can delete budgets for their businesses" ON public.presupuestos;

-- Drop restrictive policies for productos_presupuesto table
DROP POLICY IF EXISTS "Users can create budget products for their businesses" ON public.productos_presupuesto;
DROP POLICY IF EXISTS "Users can update budget products for their businesses" ON public.productos_presupuesto;
DROP POLICY IF EXISTS "Users can delete budget products for their businesses" ON public.productos_presupuesto;

-- Create new global policies for presupuestos table
CREATE POLICY "Authenticated users can create budgets globally" 
ON public.presupuestos 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budgets globally" 
ON public.presupuestos 
FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budgets globally" 
ON public.presupuestos 
FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Create new global policies for productos_presupuesto table
CREATE POLICY "Authenticated users can create budget products globally" 
ON public.productos_presupuesto 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budget products globally" 
ON public.productos_presupuesto 
FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budget products globally" 
ON public.productos_presupuesto 
FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);