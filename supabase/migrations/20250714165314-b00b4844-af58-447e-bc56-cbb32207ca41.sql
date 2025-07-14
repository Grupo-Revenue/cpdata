-- Create public_budget_links table for managing public budget links
CREATE TABLE public.public_budget_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id UUID NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  link_url TEXT NOT NULL,
  hubspot_property TEXT, -- link_cotizacion_1, link_cotizacion_2, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_public_budget_links_presupuesto_id ON public.public_budget_links(presupuesto_id);
CREATE INDEX idx_public_budget_links_negocio_id ON public.public_budget_links(negocio_id);
CREATE INDEX idx_public_budget_links_is_active ON public.public_budget_links(is_active);

-- Create unique constraint to ensure only one active link per presupuesto
CREATE UNIQUE INDEX idx_public_budget_links_unique_active 
ON public.public_budget_links(presupuesto_id) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.public_budget_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create public links for their budgets" 
ON public.public_budget_links 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  presupuesto_id IN (
    SELECT p.id 
    FROM presupuestos p 
    JOIN negocios n ON p.negocio_id = n.id 
    WHERE n.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own public links" 
ON public.public_budget_links 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  presupuesto_id IN (
    SELECT p.id 
    FROM presupuestos p 
    JOIN negocios n ON p.negocio_id = n.id 
    WHERE n.user_id = auth.uid()
  )
);

CREATE POLICY "System can access active public links" 
ON public.public_budget_links 
FOR SELECT 
USING (
  is_active = true AND 
  (expires_at IS NULL OR expires_at > now())
);

-- Update trigger for updated_at
CREATE TRIGGER update_public_budget_links_updated_at
BEFORE UPDATE ON public.public_budget_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();