-- First, update any existing records that might have legacy states to new states
UPDATE public.negocios 
SET estado = CASE 
    WHEN estado = 'prospecto' THEN 'oportunidad_creada'
    WHEN estado = 'activo' THEN 'presupuesto_enviado'
    WHEN estado = 'revision_pendiente' THEN 'presupuesto_enviado'
    WHEN estado = 'en_negociacion' THEN 'presupuesto_enviado'
    WHEN estado = 'parcialmente_ganado' THEN 'parcialmente_aceptado'
    WHEN estado = 'ganado' THEN 'negocio_aceptado'
    WHEN estado = 'perdido' THEN 'negocio_perdido'
    WHEN estado = 'cerrado' THEN 'negocio_cerrado'
    WHEN estado = 'cancelado' THEN 'negocio_perdido'
    ELSE estado
END
WHERE estado IN (
    'prospecto', 'activo', 'revision_pendiente', 'en_negociacion', 
    'parcialmente_ganado', 'ganado', 'perdido', 'cerrado', 'cancelado'
);

-- Create new enum with only the current business states
CREATE TYPE public.estado_negocio_new AS ENUM (
    'oportunidad_creada',
    'presupuesto_enviado', 
    'parcialmente_aceptado',
    'negocio_aceptado',
    'negocio_cerrado',
    'negocio_perdido'
);

-- Update the calcular_estado_negocio function to use the new enum type
CREATE OR REPLACE FUNCTION public.calcular_estado_negocio(negocio_id_param uuid)
RETURNS estado_negocio_new
LANGUAGE plpgsql
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
        RETURN 'oportunidad_creada'::estado_negocio_new;
    END IF;

    -- Si todos los presupuestos aprobados están facturados, es negocio cerrado
    IF presupuestos_aprobados > 0 AND presupuestos_facturados = presupuestos_aprobados THEN
        RETURN 'negocio_cerrado'::estado_negocio_new;
    END IF;

    -- Si tiene presupuestos aprobados (sin facturar completamente), es negocio aceptado
    IF presupuestos_aprobados = total_presupuestos THEN
        RETURN 'negocio_aceptado'::estado_negocio_new;
    END IF;

    -- Si tiene algunos presupuestos aprobados pero no todos, es parcialmente aceptado
    IF presupuestos_aprobados > 0 AND presupuestos_aprobados < total_presupuestos THEN
        RETURN 'parcialmente_aceptado'::estado_negocio_new;
    END IF;

    -- Si todos los presupuestos están rechazados o vencidos, es negocio perdido
    IF (presupuestos_rechazados + presupuestos_vencidos) = total_presupuestos THEN
        RETURN 'negocio_perdido'::estado_negocio_new;
    END IF;

    -- Si tiene presupuestos enviados o en borrador, es presupuesto enviado
    IF presupuestos_enviados > 0 OR presupuestos_borrador > 0 THEN
        RETURN 'presupuesto_enviado'::estado_negocio_new;
    END IF;

    -- Por defecto, es oportunidad creada
    RETURN 'oportunidad_creada'::estado_negocio_new;
END;
$function$;