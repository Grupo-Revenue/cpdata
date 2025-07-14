-- Create a public access function for budget data that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_public_budget_data(
  p_negocio_id UUID, 
  p_presupuesto_id UUID
)
RETURNS TABLE(
  presupuesto_data JSONB,
  negocio_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  presupuesto_exists BOOLEAN;
  negocio_exists BOOLEAN;
BEGIN
  -- Check if presupuesto exists and is public (published or approved)
  SELECT EXISTS(
    SELECT 1 FROM presupuestos 
    WHERE id = p_presupuesto_id 
    AND negocio_id = p_negocio_id
    AND estado IN ('publicado', 'aprobado')
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
$$;