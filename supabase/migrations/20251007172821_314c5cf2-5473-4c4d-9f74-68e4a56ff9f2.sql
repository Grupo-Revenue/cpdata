-- Eliminar la política antigua restrictiva
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON public.profiles;

-- Crear nueva política que permite a admins y usuarios crear perfiles
CREATE POLICY "System and users can create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario es admin (puede crear perfiles para cualquier usuario)
  check_is_admin(auth.uid())
  OR
  -- O está creando su propio perfil (funcionalidad existente)
  auth.uid() = id
);