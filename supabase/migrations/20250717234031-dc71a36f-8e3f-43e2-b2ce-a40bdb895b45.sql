-- Fix RLS policies inconsistencies for presupuestos table
-- Make all policies consistent by using authenticated role instead of mixing authenticated and public

-- Drop existing inconsistent policies
DROP POLICY IF EXISTS "Authenticated users can create budgets globally" ON public.presupuestos;
DROP POLICY IF EXISTS "Authenticated users can delete budgets globally" ON public.presupuestos;
DROP POLICY IF EXISTS "Authenticated users can update budgets globally" ON public.presupuestos;
DROP POLICY IF EXISTS "Authenticated users can view all budgets" ON public.presupuestos;

-- Create consistent policies for authenticated users
CREATE POLICY "Authenticated users can create budgets globally" 
ON public.presupuestos 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budgets globally" 
ON public.presupuestos 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budgets globally" 
ON public.presupuestos 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all budgets" 
ON public.presupuestos 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);