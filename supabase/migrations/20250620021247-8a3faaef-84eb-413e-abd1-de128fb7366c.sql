
-- Drop the existing problematic RLS policies that cause circular dependencies
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios roles" ON public.user_roles;
DROP POLICY IF EXISTS "Solo admins pueden insertar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Solo admins pueden actualizar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Solo admins pueden eliminar roles" ON public.user_roles;

-- Create new RLS policies that don't cause circular dependencies
-- Allow users to see their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users with admin role to see all roles (using SECURITY DEFINER function)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow users with admin role to insert roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow users with admin role to update roles
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow users with admin role to delete roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
