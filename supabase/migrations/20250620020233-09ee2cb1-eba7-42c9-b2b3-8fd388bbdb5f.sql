
-- Insertar rol de administrador para el usuario pablo@gruporevenue.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'pablo@gruporevenue.com'
ON CONFLICT (user_id, role) DO NOTHING;
