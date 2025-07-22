
-- Función para diagnosticar y corregir contadores de usuarios
CREATE OR REPLACE FUNCTION public.fix_all_user_counters()
RETURNS TABLE(
    user_id UUID,
    old_counter INTEGER,
    max_used_number INTEGER,
    new_counter INTEGER,
    correction_applied BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    user_record RECORD;
    max_numero INTEGER;
    current_counter INTEGER;
    new_counter_value INTEGER;
BEGIN
    -- Iterar sobre todos los usuarios que tienen negocios
    FOR user_record IN 
        SELECT DISTINCT n.user_id
        FROM public.negocios n
    LOOP
        -- Obtener el número máximo usado por este usuario
        SELECT COALESCE(MAX(numero), 0)
        INTO max_numero
        FROM public.negocios
        WHERE user_id = user_record.user_id;
        
        -- Obtener el contador actual
        SELECT COALESCE(contador_negocio, 0)
        INTO current_counter
        FROM public.contadores_usuario
        WHERE user_id = user_record.user_id;
        
        -- Calcular el nuevo contador (máximo usado + margen de seguridad de 10)
        new_counter_value := max_numero + 10;
        
        -- Solo corregir si el contador actual es menor que el máximo usado
        IF current_counter < max_numero THEN
            -- Actualizar el contador
            UPDATE public.contadores_usuario
            SET contador_negocio = new_counter_value,
                updated_at = now()
            WHERE user_id = user_record.user_id;
            
            -- Si no existía contador, crearlo
            IF NOT FOUND THEN
                INSERT INTO public.contadores_usuario (user_id, contador_negocio)
                VALUES (user_record.user_id, new_counter_value);
            END IF;
            
            -- Registrar en auditoría
            INSERT INTO public.business_number_audit (
                user_id,
                business_number,
                status,
                notes
            ) VALUES (
                user_record.user_id,
                new_counter_value,
                'counter_corrected',
                format('Counter corrected from %s to %s (max used: %s)', current_counter, new_counter_value, max_numero)
            );
            
            -- Retornar información de la corrección
            RETURN QUERY SELECT 
                user_record.user_id,
                current_counter,
                max_numero,
                new_counter_value,
                true;
        ELSE
            -- No necesita corrección
            RETURN QUERY SELECT 
                user_record.user_id,
                current_counter,
                max_numero,
                current_counter,
                false;
        END IF;
    END LOOP;
END;
$function$;

-- Mejorar la función de verificación de consistencia
CREATE OR REPLACE FUNCTION public.check_business_numbering_consistency(p_user_id UUID)
RETURNS TABLE(
    issue_type TEXT,
    description TEXT,
    expected_number INTEGER,
    actual_number INTEGER,
    negocio_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    current_counter INTEGER;
    max_used_number INTEGER;
BEGIN
    -- Obtener el contador actual y el máximo número usado
    SELECT contador_negocio INTO current_counter
    FROM public.contadores_usuario 
    WHERE user_id = p_user_id;
    
    SELECT COALESCE(MAX(numero), 0) INTO max_used_number
    FROM public.negocios 
    WHERE user_id = p_user_id;
    
    -- Verificar si el contador está por debajo del máximo usado (problema crítico)
    IF current_counter < max_used_number THEN
        RETURN QUERY SELECT 
            'counter_behind'::TEXT as issue_type,
            format('Counter (%s) is behind max used number (%s)', current_counter, max_used_number)::TEXT as description,
            max_used_number::INTEGER as expected_number,
            current_counter::INTEGER as actual_number,
            NULL::UUID as negocio_id;
    END IF;
    
    -- Verificar saltos en la numeración
    RETURN QUERY
    WITH number_gaps AS (
        SELECT 
            numero,
            LAG(numero) OVER (ORDER BY numero) as prev_numero,
            id as negocio_id
        FROM public.negocios 
        WHERE user_id = p_user_id
        ORDER BY numero
    )
    SELECT 
        'gap'::TEXT as issue_type,
        format('Gap in numbering sequence between %s and %s', prev_numero, numero)::TEXT as description,
        (prev_numero + 1)::INTEGER as expected_number,
        numero::INTEGER as actual_number,
        negocio_id
    FROM number_gaps 
    WHERE numero - prev_numero > 1;
    
    -- Verificar duplicados
    RETURN QUERY
    SELECT 
        'duplicate'::TEXT as issue_type,
        format('Duplicate business number %s found', numero)::TEXT as description,
        numero::INTEGER as expected_number,
        numero::INTEGER as actual_number,
        MIN(id) as negocio_id
    FROM public.negocios 
    WHERE user_id = p_user_id
    GROUP BY numero
    HAVING COUNT(*) > 1;
END;
$function$;

-- Mejorar la función de obtener próximo número con validación preventiva
CREATE OR REPLACE FUNCTION public.get_next_business_number(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    next_number INTEGER;
    max_existing_number INTEGER;
BEGIN
    -- Obtener el máximo número existente para este usuario
    SELECT COALESCE(MAX(numero), 0)
    INTO max_existing_number
    FROM public.negocios
    WHERE user_id = p_user_id;
    
    -- Usar SELECT FOR UPDATE para bloquear la fila y evitar race conditions
    SELECT contador_negocio + 1
    INTO next_number
    FROM public.contadores_usuario 
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Si no existe contador para el usuario, crear uno con valor inicial
    IF next_number IS NULL THEN
        -- Usar el máximo entre 1200 y el máximo número existente + 1
        next_number := GREATEST(1200, max_existing_number + 1);
        
        INSERT INTO public.contadores_usuario (user_id, contador_negocio)
        VALUES (p_user_id, next_number)
        ON CONFLICT (user_id) DO UPDATE SET
            contador_negocio = next_number,
            updated_at = now();
    ELSE
        -- VALIDACIÓN CRÍTICA: Asegurar que el próximo número sea mayor al máximo existente
        IF next_number <= max_existing_number THEN
            next_number := max_existing_number + 1;
        END IF;
        
        -- Actualizar el contador con el número validado
        UPDATE public.contadores_usuario 
        SET contador_negocio = next_number,
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Log de auditoría con información de validación
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

-- Función para ejecutar el mantenimiento completo del sistema
CREATE OR REPLACE FUNCTION public.run_numbering_system_maintenance()
RETURNS TABLE(
    maintenance_type TEXT,
    affected_users INTEGER,
    corrections_made INTEGER,
    issues_found INTEGER,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    counter_corrections INTEGER := 0;
    total_users INTEGER := 0;
    total_issues INTEGER := 0;
BEGIN
    -- 1. Corregir contadores de todos los usuarios
    SELECT COUNT(*) INTO counter_corrections
    FROM public.fix_all_user_counters()
    WHERE correction_applied = true;
    
    SELECT COUNT(DISTINCT user_id) INTO total_users
    FROM public.contadores_usuario;
    
    -- 2. Verificar consistencia global
    SELECT COUNT(*) INTO total_issues
    FROM (
        SELECT DISTINCT u.user_id
        FROM public.contadores_usuario u
        CROSS JOIN LATERAL public.check_business_numbering_consistency(u.user_id) AS issues
    ) AS all_issues;
    
    -- Retornar resumen del mantenimiento
    RETURN QUERY SELECT 
        'counter_correction'::TEXT as maintenance_type,
        total_users::INTEGER as affected_users,
        counter_corrections::INTEGER as corrections_made,
        total_issues::INTEGER as issues_found,
        CASE 
            WHEN total_issues = 0 THEN 'clean'
            WHEN total_issues < counter_corrections THEN 'improved'
            ELSE 'needs_attention'
        END::TEXT as status;
END;
$function$;
