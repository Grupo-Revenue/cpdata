
-- Paso 1: Actualizar los enums para incluir los nuevos estados
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'prospecto';
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'perdido';
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'ganado';

ALTER TYPE public.estado_presupuesto ADD VALUE IF NOT EXISTS 'vencido';
ALTER TYPE public.estado_presupuesto ADD VALUE IF NOT EXISTS 'cancelado';

-- Paso 2: Agregar columnas para fechas de vencimiento en presupuestos
ALTER TABLE public.presupuestos 
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_rechazo TIMESTAMP WITH TIME ZONE;
