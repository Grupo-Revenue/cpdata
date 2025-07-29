-- Add missing columns to productos_presupuesto table for discount and comments
ALTER TABLE public.productos_presupuesto 
ADD COLUMN descuento_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN comentarios TEXT;