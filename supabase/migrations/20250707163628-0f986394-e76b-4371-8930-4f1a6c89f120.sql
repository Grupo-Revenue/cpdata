
-- Eliminar la política restrictiva actual para negocios
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.negocios;

-- Crear nueva política que permite a todos los usuarios autenticados ver todos los negocios
CREATE POLICY "Authenticated users can view all businesses" 
  ON public.negocios 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- También actualizar las políticas para presupuestos para que sean consistentes
DROP POLICY IF EXISTS "Users can view budgets for their businesses" ON public.presupuestos;

CREATE POLICY "Authenticated users can view all budgets" 
  ON public.presupuestos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Actualizar políticas para productos de presupuesto
DROP POLICY IF EXISTS "Users can view budget products for their businesses" ON public.productos_presupuesto;

CREATE POLICY "Authenticated users can view all budget products" 
  ON public.productos_presupuesto 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Actualizar políticas para contactos para que sean visibles por todos
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contactos;

CREATE POLICY "Authenticated users can view all contacts" 
  ON public.contactos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Actualizar políticas para empresas para que sean visibles por todos
DROP POLICY IF EXISTS "Users can view their own companies" ON public.empresas;

CREATE POLICY "Authenticated users can view all companies" 
  ON public.empresas 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);
