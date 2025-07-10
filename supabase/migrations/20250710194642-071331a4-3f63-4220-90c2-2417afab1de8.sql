-- Fix the trigger_actualizar_fechas_presupuesto function to use 'publicado' instead of 'enviado'
CREATE OR REPLACE FUNCTION public.trigger_actualizar_fechas_presupuesto()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Solo procesar si el estado cambió
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado != NEW.estado) THEN
        CASE NEW.estado
            WHEN 'publicado' THEN
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
$function$;