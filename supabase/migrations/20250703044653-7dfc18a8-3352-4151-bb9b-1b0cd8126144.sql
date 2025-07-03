-- Add sessions column to productos_presupuesto table to store accreditation session data
ALTER TABLE public.productos_presupuesto 
ADD COLUMN sessions JSONB DEFAULT NULL;

-- Add index for better performance when querying sessions
CREATE INDEX idx_productos_presupuesto_sessions ON public.productos_presupuesto USING GIN(sessions) WHERE sessions IS NOT NULL;