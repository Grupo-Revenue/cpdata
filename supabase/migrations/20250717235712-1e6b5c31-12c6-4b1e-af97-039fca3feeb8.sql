-- Fix trigger function to use SECURITY DEFINER for proper permissions
CREATE OR REPLACE FUNCTION public.trigger_actualizar_estado_negocio()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER  -- This allows the function to run with elevated permissions
AS $function$
DECLARE
    negocio_id_var UUID;
    estado_anterior estado_negocio;
    estado_nuevo estado_negocio;
    sync_log_id UUID;
BEGIN
    -- Actualizar presupuestos vencidos primero
    PERFORM public.actualizar_presupuestos_vencidos();
    
    -- Obtener el negocio_id
    negocio_id_var := CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.negocio_id 
        ELSE NEW.negocio_id 
    END;
    
    -- Obtener el estado anterior del negocio
    SELECT estado INTO estado_anterior 
    FROM public.negocios 
    WHERE id = negocio_id_var;
    
    -- Calcular el nuevo estado del negocio
    estado_nuevo := public.calcular_estado_negocio(negocio_id_var);
    
    -- Actualizar el estado del negocio
    UPDATE public.negocios 
    SET estado = estado_nuevo,
        updated_at = now()
    WHERE id = negocio_id_var;
    
    -- Si el estado cambió, sincronizar con HubSpot
    IF estado_anterior IS DISTINCT FROM estado_nuevo THEN
        -- Insertar en el log de sincronización para tracking
        -- Con SECURITY DEFINER, esta inserción tendrá permisos de sistema
        INSERT INTO hubspot_sync_log (
            negocio_id,
            operation_type,
            status,
            request_payload,
            trigger_source
        ) VALUES (
            negocio_id_var,
            'estado_change',
            'pending',
            jsonb_build_object(
                'negocio_id', negocio_id_var,
                'estado_anterior', estado_anterior,
                'estado_nuevo', estado_nuevo,
                'timestamp', extract(epoch from now())
            ),
            'database_trigger'
        ) RETURNING id INTO sync_log_id;
        
        -- Llamar a la Edge Function de HubSpot usando pg_net
        BEGIN
            PERFORM
                net.http_post(
                    url := 'https://ejvtuuvigcqpibpfcxch.supabase.co/functions/v1/hubspot-deal-update',
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnR1dXZpZ2NxcGlicGZjeGNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODQzMSwiZXhwIjoyMDY1OTU0NDMxfQ.u5kUfOa1Lw2qzmbFhQ0YhD1Qe_VwAGDgDa_oBTa7ZQ0'
                    ),
                    body := jsonb_build_object(
                        'negocio_id', negocio_id_var,
                        'estado_anterior', estado_anterior,
                        'estado_nuevo', estado_nuevo
                    )
                );
            
            -- Actualizar el log como exitoso si no hubo errores
            UPDATE hubspot_sync_log 
            SET status = 'pending',
                updated_at = now()
            WHERE id = sync_log_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Si falla la llamada HTTP, loguear el error usando el ID específico
                UPDATE hubspot_sync_log 
                SET status = 'failed',
                    error_message = SQLERRM,
                    processed_at = now()
                WHERE id = sync_log_id;
        END;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$;