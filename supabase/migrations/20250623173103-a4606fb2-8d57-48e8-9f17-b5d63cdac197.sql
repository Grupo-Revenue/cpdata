
-- Step 1: Add new business states to the enum (must be done separately)
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'oportunidad_creada';
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'presupuesto_enviado';
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'parcialmente_aceptado';
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'negocio_aceptado';
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'negocio_cerrado';
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'negocio_perdido';

-- Step 2: Add new states to budget enum
ALTER TYPE public.estado_presupuesto ADD VALUE IF NOT EXISTS 'vencido';
ALTER TYPE public.estado_presupuesto ADD VALUE IF NOT EXISTS 'cancelado';
