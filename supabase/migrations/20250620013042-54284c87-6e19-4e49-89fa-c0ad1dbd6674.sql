
-- Crear enum para los roles de la aplicación
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Crear tabla para roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función para verificar roles (SECURITY DEFINER para evitar recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Los usuarios pueden ver sus propios roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Solo admins pueden insertar roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Solo admins pueden actualizar roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Solo admins pueden eliminar roles"
  ON public.user_roles
  FOR DELETE
  USING (public.is_admin());

-- Crear tabla de biblioteca de productos para admins
CREATE TABLE public.productos_biblioteca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_base NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'General',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en productos_biblioteca
ALTER TABLE public.productos_biblioteca ENABLE ROW LEVEL SECURITY;

-- Políticas para productos_biblioteca
CREATE POLICY "Todos pueden ver productos activos"
  ON public.productos_biblioteca
  FOR SELECT
  USING (activo = true OR public.is_admin());

CREATE POLICY "Solo admins pueden insertar productos"
  ON public.productos_biblioteca
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Solo admins pueden actualizar productos"
  ON public.productos_biblioteca
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Solo admins pueden eliminar productos"
  ON public.productos_biblioteca
  FOR DELETE
  USING (public.is_admin());

-- Insertar productos iniciales
INSERT INTO public.productos_biblioteca (nombre, descripcion, precio_base, categoria) VALUES
('Acreditación Digital', 'Sistema de acreditación digital con QR', 15000, 'Acreditación'),
('Acreditación Presencial', 'Stand de acreditación con personal', 25000, 'Acreditación'),
('Confirmación por Email', 'Sistema automatizado de confirmación', 8000, 'Confirmación'),
('Confirmación Telefónica', 'Llamadas de confirmación personalizadas', 12000, 'Confirmación'),
('Base de Datos Personalizada', 'Desarrollo de BD específica para el evento', 45000, 'Desarrollo'),
('Reportes en Tiempo Real', 'Dashboard con métricas en vivo', 35000, 'Reportes');

-- Crear tabla de configuración de marca
CREATE TABLE public.configuracion_marca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa TEXT NOT NULL DEFAULT 'CP Data',
  logo_url TEXT,
  color_primario TEXT DEFAULT '#3B82F6',
  color_secundario TEXT DEFAULT '#1E40AF',
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  sitio_web TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en configuracion_marca
ALTER TABLE public.configuracion_marca ENABLE ROW LEVEL SECURITY;

-- Políticas para configuracion_marca
CREATE POLICY "Todos pueden ver configuración de marca"
  ON public.configuracion_marca
  FOR SELECT
  USING (true);

CREATE POLICY "Solo admins pueden modificar configuración de marca"
  ON public.configuracion_marca
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Insertar configuración inicial
INSERT INTO public.configuracion_marca (nombre_empresa, telefono, email) VALUES
('CP Data', '+56 9 1234 5678', 'contacto@cpdata.cl');

-- Actualizar políticas RLS existentes para incluir verificación de admin
-- Agregar políticas para que admins puedan ver todos los datos

-- Para contactos
CREATE POLICY "Admins pueden ver todos los contactos"
  ON public.contactos
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins pueden modificar todos los contactos"
  ON public.contactos
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Para empresas
CREATE POLICY "Admins pueden ver todas las empresas"
  ON public.empresas
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins pueden modificar todas las empresas"
  ON public.empresas
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Para negocios
CREATE POLICY "Admins pueden ver todos los negocios"
  ON public.negocios
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins pueden modificar todos los negocios"
  ON public.negocios
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Para presupuestos
CREATE POLICY "Admins pueden ver todos los presupuestos"
  ON public.presupuestos
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins pueden modificar todos los presupuestos"
  ON public.presupuestos
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Para productos_presupuesto
CREATE POLICY "Admins pueden ver todos los productos de presupuesto"
  ON public.productos_presupuesto
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins pueden modificar todos los productos de presupuesto"
  ON public.productos_presupuesto
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
