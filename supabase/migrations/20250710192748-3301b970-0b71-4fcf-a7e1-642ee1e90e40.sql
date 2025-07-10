-- Update the estado_presupuesto enum to change 'enviado' to 'publicado'
ALTER TYPE public.estado_presupuesto RENAME VALUE 'enviado' TO 'publicado';