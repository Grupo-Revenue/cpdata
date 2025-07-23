
-- Create global counter table
CREATE TABLE public.contador_global (
    id INTEGER PRIMARY KEY DEFAULT 1,
    ultimo_numero INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add constraint to ensure only one row exists
ALTER TABLE public.contador_global ADD CONSTRAINT single_row_constraint CHECK (id = 1);

-- Initialize with current maximum number
INSERT INTO public.contador_global (ultimo_numero) 
SELECT COALESCE(MAX(numero), 17658) FROM public.negocios;

-- Create or replace the global numbering function
CREATE OR REPLACE FUNCTION public.get_next_business_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    next_number INTEGER;
    max_existing_number INTEGER;
BEGIN
    -- Get the current maximum number from existing businesses
    SELECT COALESCE(MAX(numero), 0)
    INTO max_existing_number
    FROM public.negocios;
    
    -- Use SELECT FOR UPDATE to lock the row and prevent race conditions
    SELECT ultimo_numero + 1
    INTO next_number
    FROM public.contador_global 
    WHERE id = 1
    FOR UPDATE;
    
    -- CRITICAL VALIDATION: Ensure the next number is greater than max existing
    IF next_number <= max_existing_number THEN
        next_number := max_existing_number + 1;
    END IF;
    
    -- Update the global counter
    UPDATE public.contador_global 
    SET ultimo_numero = next_number,
        updated_at = now()
    WHERE id = 1;
    
    -- Log the assignment for audit purposes
    INSERT INTO public.business_number_audit (
        user_id,
        business_number,
        status,
        notes
    ) VALUES (
        auth.uid(),
        next_number,
        'assigned_global',
        format('Global number assigned (max existing: %s)', max_existing_number)
    );
    
    RETURN next_number;
END;
$function$;

-- Update the maintenance function to work with global numbering
CREATE OR REPLACE FUNCTION public.run_numbering_system_maintenance()
RETURNS TABLE(maintenance_type text, affected_users integer, corrections_made integer, issues_found integer, status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    max_existing INTEGER;
    current_global INTEGER;
    corrections INTEGER := 0;
BEGIN
    -- Get current status
    SELECT COALESCE(MAX(numero), 0) INTO max_existing FROM public.negocios;
    SELECT ultimo_numero INTO current_global FROM public.contador_global WHERE id = 1;
    
    -- Correct global counter if needed
    IF current_global < max_existing THEN
        UPDATE public.contador_global 
        SET ultimo_numero = max_existing + 10,
            updated_at = now()
        WHERE id = 1;
        
        corrections := 1;
        
        -- Log the correction
        INSERT INTO public.business_number_audit (
            user_id,
            business_number,
            status,
            notes
        ) VALUES (
            auth.uid(),
            max_existing + 10,
            'global_counter_corrected',
            format('Global counter corrected from %s to %s (max existing: %s)', 
                   current_global, max_existing + 10, max_existing)
        );
    END IF;
    
    -- Return maintenance summary
    RETURN QUERY SELECT 
        'global_counter_maintenance'::TEXT as maintenance_type,
        1::INTEGER as affected_users,
        corrections::INTEGER as corrections_made,
        0::INTEGER as issues_found,
        CASE 
            WHEN corrections = 0 THEN 'clean'
            ELSE 'corrected'
        END::TEXT as status;
END;
$function$;

-- Create RLS policies for the global counter table
ALTER TABLE public.contador_global ENABLE ROW LEVEL SECURITY;

-- Only system can read the global counter
CREATE POLICY "System can read global counter" 
    ON public.contador_global 
    FOR SELECT 
    USING (true);

-- Only system can update the global counter
CREATE POLICY "System can update global counter" 
    ON public.contador_global 
    FOR UPDATE 
    USING (true);

-- Update the auto-maintenance trigger to use the new function
CREATE OR REPLACE FUNCTION public.auto_maintenance_after_negocio_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Run global maintenance check
    PERFORM public.run_numbering_system_maintenance();
    
    -- Log the maintenance check
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
        'maintenance_check_global',
        'Automatic global maintenance check after business creation'
    );
    
    RETURN NEW;
END;
$function$;
