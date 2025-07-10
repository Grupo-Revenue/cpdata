-- Fix the enqueue_hubspot_sync function to remove reference to non-existent table
CREATE OR REPLACE FUNCTION public.enqueue_hubspot_sync(
  p_negocio_id uuid, 
  p_operation_type text, 
  p_payload jsonb, 
  p_priority integer DEFAULT 5, 
  p_trigger_source text DEFAULT 'realtime'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    sync_log_id UUID;
BEGIN
    -- Insert into sync log for tracking
    INSERT INTO hubspot_sync_log (
        negocio_id,
        operation_type,
        status,
        request_payload,
        trigger_source
    ) VALUES (
        p_negocio_id,
        p_operation_type,
        'pending',
        p_payload,
        p_trigger_source
    ) RETURNING id INTO sync_log_id;
    
    RETURN sync_log_id;
END;
$function$;

-- Fix calcular_estado_negocio to never return null
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

    -- Por defecto, es oportunidad creada (NUNCA retorna null)
    RETURN 'oportunidad_creada'::estado_negocio;
END;
$function$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS trigger_actualizar_estado_negocio_presupuestos ON public.presupuestos;
DROP TRIGGER IF EXISTS trigger_hubspot_sync_on_negocio_update ON public.negocios;

-- Create a single, simple trigger for updating business state when budgets change
CREATE OR REPLACE FUNCTION public.trigger_actualizar_estado_negocio()
RETURNS trigger
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

-- Create the trigger on presupuestos table
CREATE TRIGGER trigger_actualizar_estado_negocio_presupuestos
    AFTER INSERT OR UPDATE OR DELETE ON public.presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_actualizar_estado_negocio();