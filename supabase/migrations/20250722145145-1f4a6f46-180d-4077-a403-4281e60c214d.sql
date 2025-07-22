
-- Crear función atómica para obtener el próximo número correlativo
CREATE OR REPLACE FUNCTION public.get_next_business_number(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    next_number INTEGER;
BEGIN
    -- Usar SELECT FOR UPDATE para bloquear la fila y evitar race conditions
    SELECT contador_negocio + 1
    INTO next_number
    FROM public.contadores_usuario 
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Si no existe contador para el usuario, crear uno con valor inicial
    IF next_number IS NULL THEN
        -- Insertar contador inicial (empezando desde 1200)
        INSERT INTO public.contadores_usuario (user_id, contador_negocio)
        VALUES (p_user_id, 1200)
        ON CONFLICT (user_id) DO NOTHING;
        
        next_number := 1200;
    END IF;
    
    -- Actualizar el contador inmediatamente para reservar el número
    UPDATE public.contadores_usuario 
    SET contador_negocio = next_number,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN next_number;
END;
$function$;

-- Crear tabla de auditoría para números asignados
CREATE TABLE IF NOT EXISTS public.business_number_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    business_number INTEGER NOT NULL,
    negocio_id UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'assigned', -- assigned, used, failed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_business_number_audit_user_id ON public.business_number_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_business_number_audit_number ON public.business_number_audit(business_number);
CREATE INDEX IF NOT EXISTS idx_business_number_audit_negocio_id ON public.business_number_audit(negocio_id);

-- Agregar constraint único para evitar duplicados de números por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_number_unique_per_user 
ON public.negocios(user_id, numero);

-- RLS para la tabla de auditoría
ALTER TABLE public.business_number_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" 
ON public.business_number_audit 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" 
ON public.business_number_audit 
FOR INSERT 
WITH CHECK (true);

-- Función para detectar inconsistencias en la numeración
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
BEGIN
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
        'Gap in numbering sequence'::TEXT as description,
        (prev_numero + 1)::INTEGER as expected_number,
        numero::INTEGER as actual_number,
        negocio_id
    FROM number_gaps 
    WHERE numero - prev_numero > 1;
    
    -- Verificar duplicados (aunque el constraint único debería prevenirlos)
    RETURN QUERY
    SELECT 
        'duplicate'::TEXT as issue_type,
        'Duplicate business number'::TEXT as description,
        numero::INTEGER as expected_number,
        numero::INTEGER as actual_number,
        MIN(id) as negocio_id
    FROM public.negocios 
    WHERE user_id = p_user_id
    GROUP BY numero
    HAVING COUNT(*) > 1;
END;
$function$;

-- Función para registrar en auditoría
CREATE OR REPLACE FUNCTION public.log_business_number_assignment(
    p_user_id UUID,
    p_business_number INTEGER,
    p_negocio_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT 'assigned',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.business_number_audit (
        user_id,
        business_number,
        negocio_id,
        status,
        notes
    ) VALUES (
        p_user_id,
        p_business_number,
        p_negocio_id,
        p_status,
        p_notes
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$function$;
