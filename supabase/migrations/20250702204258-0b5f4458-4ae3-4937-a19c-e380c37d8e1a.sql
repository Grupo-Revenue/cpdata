-- Remove legacy business states from estado_negocio enum
-- First, update any existing records that might have legacy states to new states
UPDATE public.negocios 
SET estado = CASE 
    WHEN estado = 'prospecto' THEN 'oportunidad_creada'
    WHEN estado = 'activo' THEN 'presupuesto_enviado'
    WHEN estado = 'revision_pendiente' THEN 'presupuesto_enviado'
    WHEN estado = 'en_negociacion' THEN 'presupuesto_enviado'
    WHEN estado = 'parcialmente_ganado' THEN 'parcialmente_aceptado'
    WHEN estado = 'ganado' THEN 'negocio_aceptado'
    WHEN estado = 'perdido' THEN 'negocio_perdido'
    WHEN estado = 'cerrado' THEN 'negocio_cerrado'
    WHEN estado = 'cancelado' THEN 'negocio_perdido'
    ELSE estado
END
WHERE estado IN (
    'prospecto', 'activo', 'revision_pendiente', 'en_negociacion', 
    'parcialmente_ganado', 'ganado', 'perdido', 'cerrado', 'cancelado'
);

-- Remove the default value temporarily
ALTER TABLE public.negocios ALTER COLUMN estado DROP DEFAULT;

-- Create new enum with only the current business states
CREATE TYPE public.estado_negocio_new AS ENUM (
    'oportunidad_creada',
    'presupuesto_enviado', 
    'parcialmente_aceptado',
    'negocio_aceptado',
    'negocio_cerrado',
    'negocio_perdido'
);

-- Update the table to use the new enum
ALTER TABLE public.negocios 
ALTER COLUMN estado TYPE public.estado_negocio_new 
USING estado::text::public.estado_negocio_new;

-- Drop the old enum and rename the new one
DROP TYPE public.estado_negocio;
ALTER TYPE public.estado_negocio_new RENAME TO estado_negocio;

-- Set the new default value
ALTER TABLE public.negocios 
ALTER COLUMN estado SET DEFAULT 'oportunidad_creada'::estado_negocio;