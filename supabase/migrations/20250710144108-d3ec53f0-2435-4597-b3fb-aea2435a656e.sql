-- Asignar rol de administrador al usuario miguel@revopslatam.com
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM profiles 
WHERE email = 'miguel@revopslatam.com'
ON CONFLICT (user_id, role) DO NOTHING;