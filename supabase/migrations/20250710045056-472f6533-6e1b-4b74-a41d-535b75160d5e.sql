-- Fix the security permissions for the recalculation functions
CREATE OR REPLACE FUNCTION public.recalcular_todos_estados_negocios()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    negocios_actualizados INTEGER := 0;
BEGIN
    -- Primero actualizar presupuestos vencidos
    PERFORM public.actualizar_presupuestos_vencidos();
    
    -- Recalcular estados de todos los negocios
    UPDATE public.negocios 
    SET estado = public.calcular_estado_negocio(id),
        updated_at = now();
    
    GET DIAGNOSTICS negocios_actualizados = ROW_COUNT;
    
    RETURN negocios_actualizados;
END;
$function$;

-- Also fix the actualizar_presupuestos_vencidos function
CREATE OR REPLACE FUNCTION public.actualizar_presupuestos_vencidos()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Marcar como vencidos los presupuestos enviados que pasaron su fecha de vencimiento
    UPDATE public.presupuestos 
    SET estado = 'vencido'::estado_presupuesto,
        updated_at = now()
    WHERE estado = 'enviado'::estado_presupuesto 
      AND fecha_vencimiento IS NOT NULL 
      AND fecha_vencimiento < CURRENT_DATE;
END;
$function$;

-- Fix the calcular_estado_negocio function to also have SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.calcular_estado_negocio(negocio_id_param uuid)
 RETURNS estado_negocio
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    total_presupuestos INTEGER;
    presupuestos_aprobados INTEGER;
    presupuestos_rechazados INTEGER;
    presupuestos_vencidos INTEGER;
    presupuestos_enviados INTEGER;
    presupuestos_borrador INTEGER;
    presupuestos_facturados INTEGER;
BEGIN
    -- Contar presupuestos por estado
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE estado = 'aprobado'),
        COUNT(*) FILTER (WHERE estado = 'rechazado'),
        COUNT(*) FILTER (WHERE estado = 'vencido'),
        COUNT(*) FILTER (WHERE estado = 'enviado'),
        COUNT(*) FILTER (WHERE estado = 'borrador'),
        COUNT(*) FILTER (WHERE estado = 'aprobado' AND facturado = true)
    INTO 
        total_presupuestos,
        presupuestos_aprobados,
        presupuestos_rechazados,
        presupuestos_vencidos,
        presupuestos_enviados,
        presupuestos_borrador,
        presupuestos_facturados
    FROM public.presupuestos 
    WHERE negocio_id = negocio_id_param;

    -- Si no hay presupuestos, es oportunidad creada
    IF total_presupuestos = 0 THEN
        RETURN 'oportunidad_creada'::estado_negocio;
    END IF;

    -- Si todos los presupuestos aprobados están facturados, es negocio cerrado
    IF presupuestos_aprobados > 0 AND presupuestos_facturados = presupuestos_aprobados THEN
        RETURN 'negocio_cerrado'::estado_negocio;
    END IF;

    -- Si tiene presupuestos aprobados (sin facturar completamente), es negocio aceptado
    IF presupuestos_aprobados = total_presupuestos THEN
        RETURN 'negocio_aceptado'::estado_negocio;
    END IF;

    -- Si tiene algunos presupuestos aprobados pero no todos, es parcialmente aceptado
    IF presupuestos_aprobados > 0 AND presupuestos_aprobados < total_presupuestos THEN
        RETURN 'parcialmente_aceptado'::estado_negocio;
    END IF;

    -- Si todos los presupuestos están rechazados o vencidos, es negocio perdido
    IF (presupuestos_rechazados + presupuestos_vencidos) = total_presupuestos THEN
        RETURN 'negocio_perdido'::estado_negocio;
    END IF;

    -- Si tiene presupuestos enviados o en borrador, es presupuesto enviado
    IF presupuestos_enviados > 0 OR presupuestos_borrador > 0 THEN
        RETURN 'presupuesto_enviado'::estado_negocio;
    END IF;

    -- Por defecto, es oportunidad creada
    RETURN 'oportunidad_creada'::estado_negocio;
END;
$function$;