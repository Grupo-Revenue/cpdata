
-- Solución para el deadlock circular en RLS policies

-- Paso 1: Temporalmente deshabilitar RLS en user_roles para romper el ciclo
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar todas las políticas problemáticas existentes
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Paso 3: Crear una función específica para verificar admin sin dependencias RLS
CREATE OR REPLACE FUNCTION public.check_is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Esta función bypasea RLS completamente usando SECURITY DEFINER
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::public.app_role
  )
$$;

-- Paso 4: Actualizar la función is_admin para usar la nueva función
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.check_is_admin(auth.uid())
$$;

-- Paso 5: Recrear la función has_role de manera más segura
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Paso 6: Rehabilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Paso 7: Crear políticas RLS más simples y seguras
-- Permitir que los usuarios vean sus propios roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir que los admins vean todos los roles (usando la función sin ciclo)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.check_is_admin(auth.uid()));

-- Permitir que los admins inserten roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.check_is_admin(auth.uid()));

-- Permitir que los admins actualicen roles
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.check_is_admin(auth.uid()));

-- Permitir que los admins eliminen roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.check_is_admin(auth.uid()));
