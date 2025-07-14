-- Create RLS policies to allow public read access to published budgets

-- Allow public read access to published presupuestos and their products
CREATE POLICY "Public read access to published presupuestos" 
ON public.presupuestos 
FOR SELECT 
USING (estado = 'publicado');

CREATE POLICY "Public read access to products of published presupuestos"
ON public.productos_presupuesto
FOR SELECT 
USING (
  presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE estado = 'publicado'
  )
);

-- Allow public read access to negocios that have published presupuestos
CREATE POLICY "Public read access to negocios with published presupuestos"
ON public.negocios
FOR SELECT
USING (
  id IN (
    SELECT negocio_id FROM public.presupuestos WHERE estado = 'publicado'
  )
);

-- Allow public read access to contacts, companies related to published budgets
CREATE POLICY "Public read access to contactos for published budgets"
ON public.contactos
FOR SELECT
USING (
  id IN (
    SELECT contacto_id FROM public.negocios 
    WHERE id IN (
      SELECT negocio_id FROM public.presupuestos WHERE estado = 'publicado'
    )
  )
);

CREATE POLICY "Public read access to empresas for published budgets"
ON public.empresas
FOR SELECT
USING (
  id IN (
    SELECT productora_id FROM public.negocios 
    WHERE id IN (
      SELECT negocio_id FROM public.presupuestos WHERE estado = 'publicado'
    )
    UNION
    SELECT cliente_final_id FROM public.negocios 
    WHERE id IN (
      SELECT negocio_id FROM public.presupuestos WHERE estado = 'publicado'
    )
  )
);