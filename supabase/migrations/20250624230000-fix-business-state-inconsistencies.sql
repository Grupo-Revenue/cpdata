
-- Función para corregir manualmente un negocio específico y verificar triggers
CREATE OR REPLACE FUNCTION public.fix_business_17662_and_verify_triggers()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    business_uuid UUID;
    old_state estado_negocio;
    new_state estado_negocio;
    trigger_test_result jsonb;
    final_result jsonb;
BEGIN
    -- Encontrar el UUID del negocio 17662
    SELECT id, estado INTO business_uuid, old_state
    FROM public.negocios 
    WHERE numero = 17662;
    
    IF business_uuid IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Business #17662 not found'
        );
    END IF;
    
    -- Calcular el estado correcto
    SELECT public.calcular_estado_negocio(business_uuid) INTO new_state;
    
    -- Actualizar manualmente el estado si es diferente
    IF old_state != new_state THEN
        UPDATE public.negocios 
        SET estado = new_state, updated_at = now()
        WHERE id = business_uuid;
        
        INSERT INTO public.hubspot_sync_log (
            negocio_id,
            operation_type,
            sync_direction,
            old_state,
            new_state,
            success,
            created_at
        ) VALUES (
            business_uuid,
            'manual_state_correction',
            'internal',
            old_state::text,
            new_state::text,
            true,
            now()
        );
    END IF;
    
    -- Verificar que los triggers están funcionando
    -- Creamos un test actualizando un presupuesto del negocio
    UPDATE public.presupuestos 
    SET updated_at = now()
    WHERE negocio_id = business_uuid
    LIMIT 1;
    
    -- Verificar el estado después del trigger
    SELECT estado INTO trigger_test_result
    FROM public.negocios 
    WHERE id = business_uuid;
    
    -- Construir resultado final
    SELECT jsonb_build_object(
        'success', true,
        'business_id', business_uuid,
        'business_number', 17662,
        'old_state', old_state,
        'calculated_state', new_state,
        'current_state_after_trigger', trigger_test_result,
        'state_was_corrected', old_state != new_state,
        'triggers_working', trigger_test_result = new_state,
        'timestamp', now()
    ) INTO final_result;
    
    RETURN final_result;
END;
$$;

-- Función para verificar y corregir todos los estados inconsistentes
CREATE OR REPLACE FUNCTION public.comprehensive_state_audit_and_fix()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    inconsistent_count INTEGER := 0;
    corrected_count INTEGER := 0;
    error_count INTEGER := 0;
    business_record RECORD;
    calculated_state estado_negocio;
    audit_results jsonb := '[]'::jsonb;
    business_result jsonb;
BEGIN
    -- Auditar todos los negocios
    FOR business_record IN 
        SELECT id, numero, estado 
        FROM public.negocios 
        ORDER BY numero
    LOOP
        BEGIN
            -- Calcular el estado correcto
            SELECT public.calcular_estado_negocio(business_record.id) INTO calculated_state;
            
            -- Si el estado es incorrecto, corregirlo
            IF business_record.estado != calculated_state THEN
                inconsistent_count := inconsistent_count + 1;
                
                -- Corregir el estado
                UPDATE public.negocios 
                SET estado = calculated_state, updated_at = now()
                WHERE id = business_record.id;
                
                corrected_count := corrected_count + 1;
                
                -- Log de la corrección
                INSERT INTO public.hubspot_sync_log (
                    negocio_id,
                    operation_type,
                    sync_direction,
                    old_state,
                    new_state,
                    success,
                    created_at
                ) VALUES (
                    business_record.id,
                    'comprehensive_audit_correction',
                    'internal',
                    business_record.estado::text,
                    calculated_state::text,
                    true,
                    now()
                );
                
                -- Agregar al resultado
                SELECT jsonb_build_object(
                    'business_id', business_record.id,
                    'business_number', business_record.numero,
                    'old_state', business_record.estado,
                    'new_state', calculated_state,
                    'corrected', true
                ) INTO business_result;
                
                audit_results := audit_results || business_result;
            END IF;
            
        EXCEPTION WHEN others THEN
            error_count := error_count + 1;
            
            -- Log del error
            INSERT INTO public.hubspot_sync_log (
                negocio_id,
                operation_type,
                sync_direction,
                old_state,
                new_state,
                success,
                error_message,
                created_at
            ) VALUES (
                business_record.id,
                'comprehensive_audit_error',
                'internal',
                business_record.estado::text,
                null,
                false,
                SQLERRM,
                now()
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'total_inconsistencies', inconsistent_count,
        'corrected_count', corrected_count,
        'error_count', error_count,
        'corrected_businesses', audit_results,
        'timestamp', now()
    );
END;
$$;

-- Función para logging detallado de cambios de estado
CREATE OR REPLACE FUNCTION public.trigger_log_state_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Log detallado cuando cambia el estado de un negocio
    IF TG_OP = 'UPDATE' AND OLD.estado != NEW.estado THEN
        INSERT INTO public.hubspot_sync_log (
            negocio_id,
            operation_type,
            sync_direction,
            old_state,
            new_state,
            success,
            created_at
        ) VALUES (
            NEW.id,
            'automatic_state_change',
            'internal',
            OLD.estado::text,
            NEW.estado::text,
            true,
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crear trigger para logging de cambios de estado
DROP TRIGGER IF EXISTS trigger_log_business_state_changes ON public.negocios;
CREATE TRIGGER trigger_log_business_state_changes
    AFTER UPDATE ON public.negocios
    FOR EACH ROW 
    WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
    EXECUTE FUNCTION public.trigger_log_state_changes();

-- Verificar que los triggers existentes están activos
DO $$
BEGIN
    -- Verificar trigger de actualización de estado
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_actualizar_estado_negocio_presupuestos'
        AND table_name = 'presupuestos'
    ) THEN
        RAISE WARNING 'Trigger trigger_actualizar_estado_negocio_presupuestos not found - recreating';
        
        CREATE TRIGGER trigger_actualizar_estado_negocio_presupuestos
            AFTER INSERT OR UPDATE OR DELETE ON public.presupuestos
            FOR EACH ROW EXECUTE FUNCTION public.trigger_actualizar_estado_negocio();
    END IF;
    
    -- Verificar trigger de fechas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_actualizar_fechas_presupuesto'
        AND table_name = 'presupuestos'
    ) THEN
        RAISE WARNING 'Trigger trigger_actualizar_fechas_presupuesto not found - recreating';
        
        CREATE TRIGGER trigger_actualizar_fechas_presupuesto
            BEFORE INSERT OR UPDATE ON public.presupuestos
            FOR EACH ROW EXECUTE FUNCTION public.trigger_actualizar_fechas_presupuesto();
    END IF;
END $$;
