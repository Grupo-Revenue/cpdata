-- Asignar rol de administrador al usuario actual
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM profiles 
WHERE email = 'gabriel@agenciawebketing.com'
ON CONFLICT (user_id, role) DO NOTHING;