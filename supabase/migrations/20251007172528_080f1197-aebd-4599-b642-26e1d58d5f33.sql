-- Limpiar usuarios huérfanos existentes (usuarios en auth.users sin registro en profiles)
-- Primero eliminar referencias en tablas relacionadas, luego de auth.users

-- Eliminar de contadores_usuario primero
DELETE FROM public.contadores_usuario 
WHERE user_id IN (
  SELECT au.id 
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE au.email IN ('test@test.cl', 'testhb@test.cl', 'fbahamondes@cpdata.cl')
  AND p.id IS NULL
);

-- Ahora eliminar de auth.users
DELETE FROM auth.users 
WHERE email IN ('test@test.cl', 'testhb@test.cl', 'fbahamondes@cpdata.cl')
AND id NOT IN (SELECT id FROM public.profiles);