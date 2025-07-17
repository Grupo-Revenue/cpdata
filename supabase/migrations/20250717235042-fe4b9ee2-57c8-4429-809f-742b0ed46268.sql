-- Crear datos de prueba para el usuario test@test.cl
-- Asegurar que el usuario test@test.cl tenga un negocio y presupuesto para probar

-- Primero obtener el ID del usuario test@test.cl
DO $$
DECLARE
    test_user_id UUID;
    test_contacto_id UUID;
    test_negocio_id UUID;
    test_presupuesto_id UUID;
    next_numero INTEGER;
BEGIN
    -- Obtener el user_id del usuario test@test.cl
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'test@test.cl'
    LIMIT 1;
    
    -- Si el usuario no existe, no crear nada
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Usuario test@test.cl no encontrado. No se crearán datos de prueba.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuario test@test.cl encontrado: %', test_user_id;
    
    -- Verificar si ya tiene negocios
    IF EXISTS (SELECT 1 FROM public.negocios WHERE user_id = test_user_id) THEN
        RAISE NOTICE 'Usuario test@test.cl ya tiene negocios. No se crearán datos adicionales.';
        RETURN;
    END IF;
    
    -- Obtener el siguiente número de negocio
    SELECT COALESCE(MAX(numero), 17700) + 1 INTO next_numero 
    FROM public.negocios;
    
    -- Crear contacto de prueba
    INSERT INTO public.contactos (
        user_id, nombre, apellido, email, telefono, cargo
    ) VALUES (
        test_user_id, 'Juan', 'Pérez', 'juan.perez@empresa.cl', '+56912345678', 'Gerente General'
    ) RETURNING id INTO test_contacto_id;
    
    RAISE NOTICE 'Contacto creado: %', test_contacto_id;
    
    -- Crear negocio de prueba
    INSERT INTO public.negocios (
        user_id, numero, nombre_evento, tipo_evento, locacion, 
        fecha_evento, cantidad_asistentes, cantidad_invitados, 
        horas_acreditacion, contacto_id, estado
    ) VALUES (
        test_user_id, next_numero, 'Evento de Prueba para Test User', 
        'Conferencia', 'Centro de Eventos Santiago', 
        '2025-02-15', 100, 120, '8', test_contacto_id, 'oportunidad_creada'
    ) RETURNING id INTO test_negocio_id;
    
    RAISE NOTICE 'Negocio creado: % con número %', test_negocio_id, next_numero;
    
    -- Crear presupuesto de prueba en estado borrador
    INSERT INTO public.presupuestos (
        negocio_id, nombre, estado, total, facturado
    ) VALUES (
        test_negocio_id, next_numero || 'A', 'borrador', 0, false
    ) RETURNING id INTO test_presupuesto_id;
    
    RAISE NOTICE 'Presupuesto creado: %', test_presupuesto_id;
    
    -- Crear algunos productos de ejemplo para el presupuesto
    INSERT INTO public.productos_presupuesto (
        presupuesto_id, nombre, descripcion, cantidad, precio_unitario, total
    ) VALUES 
    (test_presupuesto_id, 'Servicio de Acreditación', 'Acreditación digital para evento', 1, 500000, 500000),
    (test_presupuesto_id, 'Equipamiento Adicional', 'Equipos para registro de asistentes', 2, 150000, 300000);
    
    -- Actualizar el total del presupuesto
    UPDATE public.presupuestos 
    SET total = 800000 
    WHERE id = test_presupuesto_id;
    
    RAISE NOTICE 'Datos de prueba creados exitosamente para test@test.cl';
    RAISE NOTICE 'Negocio #% con presupuesto % en estado borrador', next_numero, next_numero || 'A';
    
END $$;