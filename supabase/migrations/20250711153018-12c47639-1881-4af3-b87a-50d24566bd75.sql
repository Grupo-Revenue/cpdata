-- Actualizar la función calcular_estado_negocio con la nueva lógica
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
    presupuestos_cancelados INTEGER;
    presupuestos_publicados INTEGER;
    presupuestos_borrador INTEGER;
    presupuestos_facturados INTEGER;
    presupuestos_con_respuesta INTEGER;
    presupuestos_solo_borrador BOOLEAN;
BEGIN
    -- Contar presupuestos por estado
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE estado = 'aprobado'),
        COUNT(*) FILTER (WHERE estado = 'rechazado'),
        COUNT(*) FILTER (WHERE estado = 'vencido'),
        COUNT(*) FILTER (WHERE estado = 'cancelado'),
        COUNT(*) FILTER (WHERE estado = 'publicado'),
        COUNT(*) FILTER (WHERE estado = 'borrador'),
        COUNT(*) FILTER (WHERE estado = 'aprobado' AND facturado = true)
    INTO 
        total_presupuestos,
        presupuestos_aprobados,
        presupuestos_rechazados,
        presupuestos_vencidos,
        presupuestos_cancelados,
        presupuestos_publicados,
        presupuestos_borrador,
        presupuestos_facturados
    FROM public.presupuestos 
    WHERE negocio_id = negocio_id_param;

    -- Calcular presupuestos con respuesta (aprobados + rechazados + vencidos + cancelados)
    presupuestos_con_respuesta := presupuestos_aprobados + presupuestos_rechazados + presupuestos_vencidos + presupuestos_cancelados;
    
    -- Verificar si solo tiene presupuestos en borrador
    presupuestos_solo_borrador := (total_presupuestos > 0 AND presupuestos_borrador = total_presupuestos);

    -- 1. Si no hay presupuestos o solo tiene borradores, es oportunidad creada
    IF total_presupuestos = 0 OR presupuestos_solo_borrador THEN
        RETURN 'oportunidad_creada'::estado_negocio;
    END IF;

    -- 2. Si todos los presupuestos aprobados están facturados, es negocio cerrado
    IF presupuestos_aprobados > 0 AND presupuestos_facturados = presupuestos_aprobados THEN
        RETURN 'negocio_cerrado'::estado_negocio;
    END IF;

    -- 3. Si todos los presupuestos están rechazados, vencidos o cancelados, es negocio perdido
    IF total_presupuestos > 0 AND (presupuestos_rechazados + presupuestos_vencidos + presupuestos_cancelados) = total_presupuestos THEN
        RETURN 'negocio_perdido'::estado_negocio;
    END IF;

    -- 4. Si todos los presupuestos tienen respuesta y al menos uno está aprobado, es negocio aceptado
    IF presupuestos_con_respuesta = total_presupuestos AND presupuestos_aprobados > 0 THEN
        RETURN 'negocio_aceptado'::estado_negocio;
    END IF;

    -- 5. Si tiene algunos presupuestos aprobados pero no todos, es parcialmente aceptado
    IF presupuestos_aprobados > 0 AND presupuestos_aprobados < total_presupuestos THEN
        RETURN 'parcialmente_aceptado'::estado_negocio;
    END IF;

    -- 6. Si tiene al menos un presupuesto publicado, es presupuesto enviado
    IF presupuestos_publicados > 0 THEN
        RETURN 'presupuesto_enviado'::estado_negocio;
    END IF;

    -- 7. Por defecto, es oportunidad creada (fallback)
    RETURN 'oportunidad_creada'::estado_negocio;
END;
$function$;

-- Recalcular todos los estados de negocios con la nueva lógica
SELECT public.recalcular_todos_estados_negocios();