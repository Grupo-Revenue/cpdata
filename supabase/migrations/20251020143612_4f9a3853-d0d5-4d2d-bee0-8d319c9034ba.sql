-- ELIMINACIÓN IRREVERSIBLE DEL NEGOCIO #4998 (CORREGIDA)
-- Advertencia: Esta operación elimina permanentemente el negocio, presupuestos, productos y sincronización

DO $$ 
DECLARE
    target_negocio_id UUID := 'b8047671-c091-479f-984c-d231353a6568';
    target_presupuesto_id UUID := 'efb50920-bb4b-4d86-80ae-3cd6013b0f2f';
    negocio_user_id UUID;
    deleted_productos INT;
    deleted_links INT;
    deleted_presupuestos INT;
    deleted_sync_logs INT;
BEGIN
    -- Verificar que el negocio existe y es el #4998
    SELECT user_id INTO negocio_user_id 
    FROM negocios 
    WHERE id = target_negocio_id AND numero = 4998;
    
    IF negocio_user_id IS NULL THEN
        RAISE EXCEPTION 'Negocio #4998 no encontrado o ID incorrecto';
    END IF;

    RAISE NOTICE 'Iniciando eliminación del negocio #4998 (user: %)', negocio_user_id;

    -- Paso 1: Eliminar productos de presupuesto
    DELETE FROM productos_presupuesto 
    WHERE presupuesto_id = target_presupuesto_id;
    GET DIAGNOSTICS deleted_productos = ROW_COUNT;
    RAISE NOTICE 'Eliminados % productos de presupuesto', deleted_productos;

    -- Paso 2: Eliminar enlaces públicos
    DELETE FROM public_budget_links 
    WHERE negocio_id = target_negocio_id;
    GET DIAGNOSTICS deleted_links = ROW_COUNT;
    RAISE NOTICE 'Eliminados % enlaces públicos', deleted_links;

    -- Paso 3: Eliminar presupuesto
    DELETE FROM presupuestos 
    WHERE id = target_presupuesto_id;
    GET DIAGNOSTICS deleted_presupuestos = ROW_COUNT;
    RAISE NOTICE 'Eliminados % presupuestos', deleted_presupuestos;

    -- Paso 4: Eliminar logs de sincronización
    DELETE FROM hubspot_sync_log 
    WHERE negocio_id = target_negocio_id;
    GET DIAGNOSTICS deleted_sync_logs = ROW_COUNT;
    RAISE NOTICE 'Eliminados % logs de sincronización', deleted_sync_logs;

    -- Paso 5: Eliminar el negocio
    DELETE FROM negocios 
    WHERE id = target_negocio_id;
    RAISE NOTICE 'Negocio #4998 eliminado exitosamente';

    -- Paso 6: Registrar en auditoría (usando user_id guardado)
    INSERT INTO business_number_audit (
        user_id,
        business_number,
        negocio_id,
        status,
        notes
    ) VALUES (
        negocio_user_id,
        4998,
        target_negocio_id,
        'deleted',
        format('Negocio eliminado permanentemente. Productos: %s, Links: %s, Presupuestos: %s, Sync logs: %s', 
               deleted_productos, deleted_links, deleted_presupuestos, deleted_sync_logs)
    );

    RAISE NOTICE '✅ Eliminación completa del negocio #4998 exitosa';
    RAISE NOTICE 'SIGUIENTE PASO: Eliminar Deal en HubSpot (ID: 46426316130) manualmente o vía API';
END $$;