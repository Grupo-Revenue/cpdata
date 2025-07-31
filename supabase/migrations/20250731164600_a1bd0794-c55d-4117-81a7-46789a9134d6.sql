-- Update the get_public_budget_data function to include rejected budgets
CREATE OR REPLACE FUNCTION public.get_public_budget_data(p_negocio_id uuid, p_presupuesto_id uuid)
 RETURNS TABLE(presupuesto_data jsonb, negocio_data jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  presupuesto_exists BOOLEAN;
  negocio_exists BOOLEAN;
BEGIN
  -- Check if presupuesto exists and is public (published, approved, or rejected)
  SELECT EXISTS(
    SELECT 1 FROM presupuestos 
    WHERE id = p_presupuesto_id 
    AND negocio_id = p_negocio_id
    AND estado IN ('publicado', 'aprobado', 'rechazado')
  ) INTO presupuesto_exists;
  
  -- Check if negocio exists
  SELECT EXISTS(
    SELECT 1 FROM negocios 
    WHERE id = p_negocio_id
  ) INTO negocio_exists;
  
  -- If either doesn't exist or presupuesto is not public, return null
  IF NOT presupuesto_exists OR NOT negocio_exists THEN
    RETURN;
  END IF;
  
  -- Return the data as JSONB
  RETURN QUERY
  SELECT 
    to_jsonb(p_data.*) as presupuesto_data,
    to_jsonb(n_data.*) as negocio_data
  FROM (
    SELECT 
      p.*,
      COALESCE(
        (SELECT jsonb_agg(pp.*) FROM productos_presupuesto pp WHERE pp.presupuesto_id = p.id),
        '[]'::jsonb
      ) as productos_presupuesto
    FROM presupuestos p 
    WHERE p.id = p_presupuesto_id
  ) p_data
  CROSS JOIN (
    SELECT 
      n.*,
      to_jsonb(c.*) as contactos,
      to_jsonb(pr.*) as empresas,
      to_jsonb(cf.*) as cliente_final
    FROM negocios n
    LEFT JOIN contactos c ON n.contacto_id = c.id
    LEFT JOIN empresas pr ON n.productora_id = pr.id  
    LEFT JOIN empresas cf ON n.cliente_final_id = cf.id
    WHERE n.id = p_negocio_id
  ) n_data;
END;
$function$;

-- Update RLS policies to include rejected budgets

-- Update presupuestos policy
DROP POLICY IF EXISTS "Public read access to published and approved presupuestos" ON presupuestos;
CREATE POLICY "Public read access to published, approved and rejected presupuestos" 
ON presupuestos FOR SELECT 
USING (estado = ANY (ARRAY['publicado'::estado_presupuesto, 'aprobado'::estado_presupuesto, 'rechazado'::estado_presupuesto]));

-- Update productos_presupuesto policy
DROP POLICY IF EXISTS "Public read access to products of published and approved presup" ON productos_presupuesto;
CREATE POLICY "Public read access to products of published, approved and rejected presupuestos" 
ON productos_presupuesto FOR SELECT 
USING (presupuesto_id IN ( SELECT presupuestos.id
   FROM presupuestos
  WHERE (presupuestos.estado = ANY (ARRAY['publicado'::estado_presupuesto, 'aprobado'::estado_presupuesto, 'rechazado'::estado_presupuesto]))));

-- Update negocios policy
DROP POLICY IF EXISTS "Public read access to negocios with published and approved pres" ON negocios;
CREATE POLICY "Public read access to negocios with published, approved and rejected presupuestos" 
ON negocios FOR SELECT 
USING (id IN ( SELECT presupuestos.negocio_id
   FROM presupuestos
  WHERE (presupuestos.estado = ANY (ARRAY['publicado'::estado_presupuesto, 'aprobado'::estado_presupuesto, 'rechazado'::estado_presupuesto]))));

-- Update contactos policy
DROP POLICY IF EXISTS "Public read access to contactos for published and approved budg" ON contactos;
CREATE POLICY "Public read access to contactos for published, approved and rejected budgets" 
ON contactos FOR SELECT 
USING (id IN ( SELECT negocios.contacto_id
   FROM negocios
  WHERE (negocios.id IN ( SELECT presupuestos.negocio_id
           FROM presupuestos
          WHERE (presupuestos.estado = ANY (ARRAY['publicado'::estado_presupuesto, 'aprobado'::estado_presupuesto, 'rechazado'::estado_presupuesto]))))));

-- Update empresas policy
DROP POLICY IF EXISTS "Public read access to empresas for published and approved budge" ON empresas;
CREATE POLICY "Public read access to empresas for published, approved and rejected budgets" 
ON empresas FOR SELECT 
USING (id IN ( SELECT negocios.productora_id
   FROM negocios
  WHERE (negocios.id IN ( SELECT presupuestos.negocio_id
           FROM presupuestos
          WHERE (presupuestos.estado = ANY (ARRAY['publicado'::estado_presupuesto, 'aprobado'::estado_presupuesto, 'rechazado'::estado_presupuesto]))))
UNION
 SELECT negocios.cliente_final_id
   FROM negocios
  WHERE (negocios.id IN ( SELECT presupuestos.negocio_id
           FROM presupuestos
          WHERE (presupuestos.estado = ANY (ARRAY['publicado'::estado_presupuesto, 'aprobado'::estado_presupuesto, 'rechazado'::estado_presupuesto]))))));