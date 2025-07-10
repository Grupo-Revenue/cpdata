-- Fix the actualizar_presupuestos_vencidos function to use 'publicado' instead of 'enviado'
CREATE OR REPLACE FUNCTION public.actualizar_presupuestos_vencidos()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Marcar como vencidos los presupuestos publicados que pasaron su fecha de vencimiento
    UPDATE public.presupuestos 
    SET estado = 'vencido'::estado_presupuesto,
        updated_at = now()
    WHERE estado = 'publicado'::estado_presupuesto 
      AND fecha_vencimiento IS NOT NULL 
      AND fecha_vencimiento < CURRENT_DATE;
END;
$function$;