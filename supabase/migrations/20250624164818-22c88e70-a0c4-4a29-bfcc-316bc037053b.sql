
-- Agregar columna facturado a presupuestos si no existe (PRIMERO)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'presupuestos' AND column_name = 'facturado') THEN
        ALTER TABLE public.presupuestos 
        ADD COLUMN facturado BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Verificar y agregar la columna estado solo si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'negocios' AND column_name = 'estado') THEN
        ALTER TABLE public.negocios 
        ADD COLUMN estado estado_negocio DEFAULT 'oportunidad_creada'::estado_negocio;
    END IF;
END $$;

-- Asegurarnos de que la función de cálculo existe con la nueva lógica
CREATE OR REPLACE FUNCTION public.calcular_estado_negocio(negocio_id_param UUID)
RETURNS estado_negocio
LANGUAGE plpgsql
AS $$
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
$$;

-- Función para marcar como facturado y actualizar estado del negocio
CREATE OR REPLACE FUNCTION public.marcar_presupuesto_facturado(presupuesto_id_param UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    negocio_id_var UUID;
BEGIN
    -- Obtener el negocio_id y marcar como facturado
    UPDATE public.presupuestos 
    SET facturado = true, updated_at = now()
    WHERE id = presupuesto_id_param AND estado = 'aprobado'
    RETURNING negocio_id INTO negocio_id_var;
    
    -- Actualizar estado del negocio
    IF negocio_id_var IS NOT NULL THEN
        UPDATE public.negocios 
        SET estado = public.calcular_estado_negocio(negocio_id_var),
            updated_at = now()
        WHERE id = negocio_id_var;
    END IF;
END;
$$;

-- Función para recalcular estados de todos los negocios (botón manual)
CREATE OR REPLACE FUNCTION public.recalcular_todos_estados_negocios()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
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
$$;

-- Recrear el trigger para actualizar estado del negocio automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_estado_negocio ON public.presupuestos;
CREATE TRIGGER trigger_actualizar_estado_negocio
    AFTER INSERT OR UPDATE OR DELETE ON public.presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_actualizar_estado_negocio();

-- Recalcular todos los estados basados en las nuevas reglas
UPDATE public.negocios 
SET estado = public.calcular_estado_negocio(id),
    updated_at = now();
