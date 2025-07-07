-- Verificar las políticas actuales y asegurar que todos los usuarios autenticados puedan ver todos los datos

-- Contactos: Asegurar que todos los usuarios autenticados puedan ver todos los contactos
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contactos;

-- La política "Authenticated users can view all contacts" ya existe según el contexto

-- Empresas: Asegurar que todos los usuarios autenticados puedan ver todas las empresas  
DROP POLICY IF EXISTS "Users can view their own companies" ON public.empresas;

-- La política "Authenticated users can view all companies" ya existe según el contexto

-- Verificar que las políticas para presupuestos y productos también permitan acceso completo
-- La política "Authenticated users can view all budgets" ya existe según el contexto
-- La política "Authenticated users can view all budget products" ya existe según el contexto

-- Verificar que la política para negocios esté activa
-- La política "Authenticated users can view all businesses" ya existe según el contexto