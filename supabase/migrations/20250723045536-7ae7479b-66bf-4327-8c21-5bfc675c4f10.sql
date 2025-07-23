-- Agregar política RLS para que los administradores puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (check_is_admin(auth.uid()));