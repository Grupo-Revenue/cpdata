-- Update RLS policies to allow public read access to both published and approved budgets

-- Drop existing policies to recreate them with expanded access
DROP POLICY IF EXISTS "Public read access to published presupuestos" ON public.presupuestos;
DROP POLICY IF EXISTS "Public read access to products of published presupuestos" ON public.productos_presupuesto;
DROP POLICY IF EXISTS "Public read access to negocios with published presupuestos" ON public.negocios;
DROP POLICY IF EXISTS "Public read access to contactos for published budgets" ON public.contactos;
DROP POLICY IF EXISTS "Public read access to empresas for published budgets" ON public.empresas;

-- Allow public read access to published AND approved presupuestos and their products
CREATE POLICY "Public read access to published and approved presupuestos" 
ON public.presupuestos 
FOR SELECT 
USING (estado IN ('publicado', 'aprobado'));

CREATE POLICY "Public read access to products of published and approved presupuestos"
ON public.productos_presupuesto
FOR SELECT 
USING (
  presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE estado IN ('publicado', 'aprobado')
  )
);

-- Allow public read access to negocios that have published or approved presupuestos
CREATE POLICY "Public read access to negocios with published and approved presupuestos"
ON public.negocios
FOR SELECT
USING (
  id IN (
    SELECT negocio_id FROM public.presupuestos WHERE estado IN ('publicado', 'aprobado')
  )
);

-- Allow public read access to contacts, companies related to published or approved budgets
CREATE POLICY "Public read access to contactos for published and approved budgets"
ON public.contactos
FOR SELECT
USING (
  id IN (
    SELECT contacto_id FROM public.negocios 
    WHERE id IN (
      SELECT negocio_id FROM public.presupuestos WHERE estado IN ('publicado', 'aprobado')
    )
  )
);

CREATE POLICY "Public read access to empresas for published and approved budgets"
ON public.empresas
FOR SELECT
USING (
  id IN (
    SELECT productora_id FROM public.negocios 
    WHERE id IN (
      SELECT negocio_id FROM public.presupuestos WHERE estado IN ('publicado', 'aprobado')
    )
    UNION
    SELECT cliente_final_id FROM public.negocios 
    WHERE id IN (
      SELECT negocio_id FROM public.presupuestos WHERE estado IN ('publicado', 'aprobado')
    )
  )
);