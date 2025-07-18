-- Migrar todos los productos de la categoría "CONFIRMACIONES" a "Confirmación"
UPDATE public.productos_biblioteca 
SET categoria = 'Confirmación'
WHERE categoria = 'CONFIRMACIONES';