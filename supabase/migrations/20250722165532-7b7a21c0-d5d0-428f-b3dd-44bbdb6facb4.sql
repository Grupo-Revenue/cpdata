
-- Actualizar la función get_next_business_number para auto-corrección automática
CREATE OR REPLACE FUNCTION public.get_next_business_number(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    next_number INTEGER;
    max_existing_number INTEGER;
    current_counter INTEGER;
BEGIN
    -- Obtener el máximo número existente para este usuario
    SELECT COALESCE(MAX(numero), 0)
    INTO max_existing_number
    FROM public.negocios
    WHERE user_id = p_user_id;
    
    -- Obtener el contador actual
    SELECT COALESCE(contador_negocio, 0)
    INTO current_counter
    FROM public.contadores_usuario 
    WHERE user_id = p_user_id;
    
    -- AUTO-CORRECCIÓN: Si el contador está desfasado, corregir automáticamente
    IF current_counter <= max_existing_number THEN
        current_counter := max_existing_number + 10; -- Margen de seguridad
        
        -- Actualizar o crear el contador corregido
        INSERT INTO public.contadores_usuario (user_id, contador_negocio)
        VALUES (p_user_id, current_counter)
        ON CONFLICT (user_id) DO UPDATE SET
            contador_negocio = current_counter,
            updated_at = now();
        
        -- Log de la auto-corrección
        INSERT INTO public.business_number_audit (
            user_id,
            business_number,
            status,
            notes
        ) VALUES (
            p_user_id,
            current_counter,
            'auto_corrected',
            format('Counter auto-corrected from %s to %s (max existing: %s)', 
                   COALESCE((SELECT contador_negocio FROM public.contadores_usuario WHERE user_id = p_user_id), 0), 
                   current_counter, 
                   max_existing_number)
        );
    END IF;
    
    -- Usar SELECT FOR UPDATE para bloquear la fila y evitar race conditions
    SELECT contador_negocio + 1
    INTO next_number
    FROM public.contadores_usuario 
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Si aún no existe contador, crear uno
    IF next_number IS NULL THEN
        next_number := GREATEST(1200, max_existing_number + 1);
        
        INSERT INTO public.contadores_usuario (user_id, contador_negocio)
        VALUES (p_user_id, next_number)
        ON CONFLICT (user_id) DO UPDATE SET
            contador_negocio = next_number,
            updated_at = now();
    ELSE
        -- VALIDACIÓN FINAL: Asegurar que el próximo número sea mayor al máximo existente
        IF next_number <= max_existing_number THEN
            next_number := max_existing_number + 1;
        END IF;
        
        -- Actualizar el contador con el número validado
        UPDATE public.contadores_usuario 
        SET contador_negocio = next_number,
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Log de auditoría del número asignado
    INSERT INTO public.business_number_audit (
        user_id,
        business_number,
        status,
        notes
    ) VALUES (
        p_user_id,
        next_number,
        'assigned',
        format('Number assigned (max existing: %s)', max_existing_number)
    );
    
    RETURN next_number;
END;
$function$;

-- Crear trigger para auto-mantenimiento después de insertar negocios
CREATE OR REPLACE FUNCTION public.auto_maintenance_after_negocio_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Verificar consistencia del usuario que insertó el negocio
    PERFORM public.check_business_numbering_consistency(NEW.user_id);
    
    -- Log del mantenimiento automático
    INSERT INTO public.business_number_audit (
        user_id,
        business_number,
        negocio_id,
        status,
        notes
    ) VALUES (
        NEW.user_id,
        NEW.numero,
        NEW.id,
        'maintenance_check',
        'Automatic maintenance check after business creation'
    );
    
    RETURN NEW;
END;
$function$;

-- Crear el trigger que se ejecuta después de insertar un negocio
DROP TRIGGER IF EXISTS auto_maintenance_trigger ON public.negocios;
CREATE TRIGGER auto_maintenance_trigger
    AFTER INSERT ON public.negocios
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_maintenance_after_negocio_insert();

-- Ejecutar corrección automática inmediata para todos los usuarios
DO $$
DECLARE
    correction_result RECORD;
BEGIN
    -- Ejecutar la corrección automática para todos los usuarios
    FOR correction_result IN 
        SELECT * FROM public.fix_all_user_counters() WHERE correction_applied = true
    LOOP
        -- Los resultados se registran automáticamente en la función
        RAISE NOTICE 'Auto-corrected user % counter from % to %', 
            correction_result.user_id, 
            correction_result.old_counter, 
            correction_result.new_counter;
    END LOOP;
END $$;
