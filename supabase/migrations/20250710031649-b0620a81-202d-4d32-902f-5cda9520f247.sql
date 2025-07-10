-- Actualizar la función para que retorne 'oportunidad_creada' cuando no hay presupuestos
CREATE OR REPLACE FUNCTION public.calcular_estado_negocio(negocio_id_param UUID)
RETURNS estado_negocio
LANGUAGE plpgsql
AS $$
DECLARE
    total_presupuestos INTEGER;
    presupuestos_aprobados INTEGER;
    presupuestos_rechazados INTEGER;
    presupuestos_vencidos INTEGER;
    tiene_enviados BOOLEAN;
BEGIN
    -- Contar presupuestos por estado
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE estado = 'aprobado'),
        COUNT(*) FILTER (WHERE estado = 'rechazado'),
        COUNT(*) FILTER (WHERE estado = 'vencido'),
        COUNT(*) FILTER (WHERE estado = 'enviado') > 0
    INTO 
        total_presupuestos,
        presupuestos_aprobados,
        presupuestos_rechazados,
        presupuestos_vencidos,
        tiene_enviados
    FROM public.presupuestos 
    WHERE negocio_id = negocio_id_param;

    -- Si no hay presupuestos, es oportunidad creada
    IF total_presupuestos = 0 THEN
        RETURN 'oportunidad_creada'::estado_negocio;
    END IF;

    -- Si tiene al menos un presupuesto aprobado, es ganado
    IF presupuestos_aprobados > 0 THEN
        RETURN 'negocio_aceptado'::estado_negocio;
    END IF;

    -- Si todos los presupuestos están rechazados o vencidos, es perdido
    IF (presupuestos_rechazados + presupuestos_vencidos) = total_presupuestos THEN
        RETURN 'negocio_perdido'::estado_negocio;
    END IF;

    -- Si tiene presupuestos enviados (pendientes), es activo
    IF tiene_enviados THEN
        RETURN 'presupuesto_enviado'::estado_negocio;
    END IF;

    -- Por defecto, es oportunidad creada
    RETURN 'oportunidad_creada'::estado_negocio;
END;
$$;