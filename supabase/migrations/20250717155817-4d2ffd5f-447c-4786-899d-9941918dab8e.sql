-- Trigger para asignar automáticamente rol 'user' a nuevos usuarios
CREATE OR REPLACE FUNCTION public.assign_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insertar rol 'user' por defecto para cada nuevo usuario
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para ejecutar la función cuando se inserte un nuevo usuario en profiles
DROP TRIGGER IF EXISTS assign_user_role_on_profile_creation ON public.profiles;
CREATE TRIGGER assign_user_role_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_user_role();