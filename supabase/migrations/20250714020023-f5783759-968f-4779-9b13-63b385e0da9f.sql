-- Crear tabla para links públicos de presupuestos
CREATE TABLE public.public_budget_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id UUID NOT NULL,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_public_budget_links_presupuesto 
    FOREIGN KEY (presupuesto_id) REFERENCES public.presupuestos(id) ON DELETE CASCADE
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_public_budget_links_presupuesto_id ON public.public_budget_links(presupuesto_id);
CREATE INDEX idx_public_budget_links_active ON public.public_budget_links(is_active);
CREATE INDEX idx_public_budget_links_expires ON public.public_budget_links(expires_at);

-- Habilitar RLS
ALTER TABLE public.public_budget_links ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan crear links para sus propios presupuestos
CREATE POLICY "Users can create public links for their budgets" 
ON public.public_budget_links 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND presupuesto_id IN (
    SELECT p.id 
    FROM public.presupuestos p 
    JOIN public.negocios n ON p.negocio_id = n.id 
    WHERE n.user_id = auth.uid()
  )
);

-- Política para que usuarios puedan ver y gestionar sus propios links
CREATE POLICY "Users can manage their own public links" 
ON public.public_budget_links 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND presupuesto_id IN (
    SELECT p.id 
    FROM public.presupuestos p 
    JOIN public.negocios n ON p.negocio_id = n.id 
    WHERE n.user_id = auth.uid()
  )
);

-- Política para que el sistema pueda acceder a links públicos activos
CREATE POLICY "System can access active public links" 
ON public.public_budget_links 
FOR SELECT 
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_public_budget_links_updated_at
BEFORE UPDATE ON public.public_budget_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();