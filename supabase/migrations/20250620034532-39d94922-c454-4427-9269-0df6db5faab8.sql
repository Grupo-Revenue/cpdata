
-- Función para calcular automáticamente el estado del negocio basado en presupuestos
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

    -- Si no hay presupuestos, es prospecto
    IF total_presupuestos = 0 THEN
        RETURN 'prospecto'::estado_negocio;
    END IF;

    -- Si tiene al menos un presupuesto aprobado, es ganado
    IF presupuestos_aprobados > 0 THEN
        RETURN 'ganado'::estado_negocio;
    END IF;

    -- Si todos los presupuestos están rechazados o vencidos, es perdido
    IF (presupuestos_rechazados + presupuestos_vencidos) = total_presupuestos THEN
        RETURN 'perdido'::estado_negocio;
    END IF;

    -- Si tiene presupuestos enviados (pendientes), es activo
    IF tiene_enviados THEN
        RETURN 'activo'::estado_negocio;
    END IF;

    -- Por defecto, es activo
    RETURN 'activo'::estado_negocio;
END;
$$;

-- Función para actualizar automáticamente estados de presupuestos vencidos
CREATE OR REPLACE FUNCTION public.actualizar_presupuestos_vencidos()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Marcar como vencidos los presupuestos enviados que pasaron su fecha de vencimiento
    UPDATE public.presupuestos 
    SET estado = 'vencido'::estado_presupuesto,
        updated_at = now()
    WHERE estado = 'enviado'::estado_presupuesto 
      AND fecha_vencimiento IS NOT NULL 
      AND fecha_vencimiento < CURRENT_DATE;
END;
$$;

-- Función trigger para actualizar automáticamente el estado del negocio
CREATE OR REPLACE FUNCTION public.trigger_actualizar_estado_negocio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;

-- Trigger para actualizar estado del negocio cuando cambian los presupuestos
DROP TRIGGER IF EXISTS trigger_actualizar_estado_negocio_presupuestos ON public.presupuestos;
CREATE TRIGGER trigger_actualizar_estado_negocio_presupuestos
    AFTER INSERT OR UPDATE OR DELETE ON public.presupuestos
    FOR EACH ROW EXECUTE FUNCTION public.trigger_actualizar_estado_negocio();

-- Función para actualizar fechas automáticamente según cambios de estado
CREATE OR REPLACE FUNCTION public.trigger_actualizar_fechas_presupuesto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Solo procesar si el estado cambió
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado != NEW.estado) THEN
        CASE NEW.estado
            WHEN 'enviado' THEN
                NEW.fecha_envio = COALESCE(NEW.fecha_envio, now());
            WHEN 'aprobado' THEN
                NEW.fecha_aprobacion = COALESCE(NEW.fecha_aprobacion, now());
            WHEN 'rechazado' THEN
                NEW.fecha_rechazo = COALESCE(NEW.fecha_rechazo, now());
            ELSE
                -- No hacer nada para otros estados
        END CASE;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger para actualizar fechas automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_fechas_presupuesto ON public.presupuestos;
CREATE TRIGGER trigger_actualizar_fechas_presupuesto
    BEFORE INSERT OR UPDATE ON public.presupuestos
    FOR EACH ROW EXECUTE FUNCTION public.trigger_actualizar_fechas_presupuesto();

-- Actualizar estados existentes basados en la nueva lógica
DO $$
BEGIN
    -- Ejecutar la función de actualización de vencidos
    PERFORM public.actualizar_presupuestos_vencidos();
    
    -- Actualizar todos los estados de negocios existentes
    UPDATE public.negocios 
    SET estado = public.calcular_estado_negocio(id),
        updated_at = now();
END $$;
