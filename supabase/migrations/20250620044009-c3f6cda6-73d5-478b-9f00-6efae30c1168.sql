
-- Primero, agregar los nuevos estados al enum estado_negocio
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'parcialmente_ganado';
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'en_negociacion';
ALTER TYPE public.estado_negocio ADD VALUE IF NOT EXISTS 'revision_pendiente';
