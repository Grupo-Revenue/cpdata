-- Eliminar negocios con números >= 17600
-- Esto eliminará en cascada los presupuestos y productos asociados
DELETE FROM negocios WHERE numero >= 17600;

-- Ajustar el contador global para que el próximo negocio sea 4998
UPDATE contador_global 
SET ultimo_numero = 4997,
    updated_at = now()
WHERE id = 1;