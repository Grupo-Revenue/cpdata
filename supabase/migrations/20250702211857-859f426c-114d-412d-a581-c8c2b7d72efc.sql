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

-- Drop the functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.trigger_actualizar_estado_negocio() CASCADE;
DROP FUNCTION IF EXISTS public.calcular_estado_negocio(uuid) CASCADE;

-- Remove the default value temporarily
ALTER TABLE public.negocios ALTER COLUMN estado DROP DEFAULT;

-- Update the table to use the new enum
ALTER TABLE public.negocios 
ALTER COLUMN estado TYPE public.estado_negocio_new 
USING estado::text::public.estado_negocio_new;

-- Drop the old enum and rename the new one
DROP TYPE public.estado_negocio;
ALTER TYPE public.estado_negocio_new RENAME TO estado_negocio;

-- Set the new default value
ALTER TABLE public.negocios 
ALTER COLUMN estado SET DEFAULT 'oportunidad_creada'::estado_negocio;

-- Recreate the calcular_estado_negocio function with clean enum values
CREATE OR REPLACE FUNCTION public.calcular_estado_negocio(negocio_id_param uuid)
RETURNS estado_negocio
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

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION public.trigger_actualizar_estado_negocio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Actualizar presupuestos vencidos primero
    PERFORM public.actualizar_presupuestos_vencidos();
    
    -- Calcular y actualizar el estado del negocio
    UPDATE public.negocios 
    SET estado = public.calcular_estado_negocio(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.negocio_id 
            ELSE NEW.negocio_id 
        END
    ),
    updated_at = now()
    WHERE id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.negocio_id 
        ELSE NEW.negocio_id 
    END;

    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER trigger_actualizar_estado_negocio_presupuestos
    AFTER INSERT OR UPDATE OR DELETE ON public.presupuestos
    FOR EACH ROW EXECUTE FUNCTION public.trigger_actualizar_estado_negocio();