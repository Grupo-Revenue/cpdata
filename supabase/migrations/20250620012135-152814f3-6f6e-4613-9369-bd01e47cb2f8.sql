
-- Create enum types for better data integrity
CREATE TYPE public.estado_negocio AS ENUM ('activo', 'cerrado', 'cancelado');
CREATE TYPE public.estado_presupuesto AS ENUM ('borrador', 'enviado', 'aprobado', 'rechazado');
CREATE TYPE public.tipo_empresa AS ENUM ('productora', 'cliente_final');

-- Create contacts table (reusable across businesses)
CREATE TABLE public.contactos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  cargo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email) -- Prevent duplicate contacts per user
);

-- Create companies table (reusable across businesses)
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  nombre TEXT NOT NULL,
  rut TEXT,
  sitio_web TEXT,
  direccion TEXT,
  tipo tipo_empresa NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, nombre, tipo) -- Prevent duplicate companies per user
);

-- Create businesses table
CREATE TABLE public.negocios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  numero INTEGER NOT NULL,
  contacto_id UUID REFERENCES public.contactos NOT NULL,
  productora_id UUID REFERENCES public.empresas,
  cliente_final_id UUID REFERENCES public.empresas,
  tipo_evento TEXT NOT NULL,
  nombre_evento TEXT NOT NULL,
  fecha_evento DATE,
  horas_acreditacion TEXT NOT NULL,
  cantidad_asistentes INTEGER DEFAULT 0,
  cantidad_invitados INTEGER DEFAULT 0,
  locacion TEXT NOT NULL,
  estado estado_negocio NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, numero) -- Ensure unique business numbers per user
);

-- Create budgets table
CREATE TABLE public.presupuestos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID REFERENCES public.negocios ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado estado_presupuesto NOT NULL DEFAULT 'borrador',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget products table
CREATE TABLE public.productos_presupuesto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id UUID REFERENCES public.presupuestos ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user counters table to track business numbers per user
CREATE TABLE public.contadores_usuario (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  contador_negocio INTEGER NOT NULL DEFAULT 17658,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contadores_usuario ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contactos
CREATE POLICY "Users can view their own contacts" ON public.contactos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contacts" ON public.contactos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON public.contactos
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON public.contactos
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for empresas
CREATE POLICY "Users can view their own companies" ON public.empresas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own companies" ON public.empresas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own companies" ON public.empresas
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own companies" ON public.empresas
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for negocios
CREATE POLICY "Users can view their own businesses" ON public.negocios
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own businesses" ON public.negocios
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own businesses" ON public.negocios
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own businesses" ON public.negocios
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for presupuestos (through negocio ownership)
CREATE POLICY "Users can view budgets for their businesses" ON public.presupuestos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.negocios 
      WHERE negocios.id = presupuestos.negocio_id 
      AND negocios.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create budgets for their businesses" ON public.presupuestos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.negocios 
      WHERE negocios.id = presupuestos.negocio_id 
      AND negocios.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update budgets for their businesses" ON public.presupuestos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.negocios 
      WHERE negocios.id = presupuestos.negocio_id 
      AND negocios.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete budgets for their businesses" ON public.presupuestos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.negocios 
      WHERE negocios.id = presupuestos.negocio_id 
      AND negocios.user_id = auth.uid()
    )
  );

-- RLS Policies for productos_presupuesto (through budget ownership)
CREATE POLICY "Users can view budget products for their businesses" ON public.productos_presupuesto
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.presupuestos 
      JOIN public.negocios ON negocios.id = presupuestos.negocio_id
      WHERE presupuestos.id = productos_presupuesto.presupuesto_id 
      AND negocios.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create budget products for their businesses" ON public.productos_presupuesto
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.presupuestos 
      JOIN public.negocios ON negocios.id = presupuestos.negocio_id
      WHERE presupuestos.id = productos_presupuesto.presupuesto_id 
      AND negocios.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update budget products for their businesses" ON public.productos_presupuesto
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.presupuestos 
      JOIN public.negocios ON negocios.id = presupuestos.negocio_id
      WHERE presupuestos.id = productos_presupuesto.presupuesto_id 
      AND negocios.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete budget products for their businesses" ON public.productos_presupuesto
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.presupuestos 
      JOIN public.negocios ON negocios.id = presupuestos.negocio_id
      WHERE presupuestos.id = productos_presupuesto.presupuesto_id 
      AND negocios.user_id = auth.uid()
    )
  );

-- RLS Policies for contadores_usuario
CREATE POLICY "Users can view their own counters" ON public.contadores_usuario
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own counters" ON public.contadores_usuario
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own counters" ON public.contadores_usuario
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to initialize user counter
CREATE OR REPLACE FUNCTION public.initialize_user_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.contadores_usuario (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to initialize counter when user is created
CREATE TRIGGER on_auth_user_created_counter
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.initialize_user_counter();

-- Function to automatically update budget totals
CREATE OR REPLACE FUNCTION public.update_budget_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.presupuestos 
    SET total = (
      SELECT COALESCE(SUM(total), 0) 
      FROM public.productos_presupuesto 
      WHERE presupuesto_id = OLD.presupuesto_id
    ),
    updated_at = now()
    WHERE id = OLD.presupuesto_id;
    RETURN OLD;
  ELSE
    UPDATE public.presupuestos 
    SET total = (
      SELECT COALESCE(SUM(total), 0) 
      FROM public.productos_presupuesto 
      WHERE presupuesto_id = NEW.presupuesto_id
    ),
    updated_at = now()
    WHERE id = NEW.presupuesto_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger to update budget totals when products change
CREATE TRIGGER update_budget_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.productos_presupuesto
  FOR EACH ROW EXECUTE PROCEDURE public.update_budget_total();
