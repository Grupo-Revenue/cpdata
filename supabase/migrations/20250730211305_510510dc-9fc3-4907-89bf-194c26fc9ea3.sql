-- Add condiciones comerciales columns to budget_terms_config table
ALTER TABLE public.budget_terms_config 
ADD COLUMN condicion_comercial_1 TEXT DEFAULT 'Validez de oferta: 30 días calendario',
ADD COLUMN condicion_comercial_2 TEXT DEFAULT 'Forma de pago: 50% anticipo, 50% contra entrega', 
ADD COLUMN condicion_comercial_3 TEXT DEFAULT 'Moneda: Pesos Chilenos (CLP)',
ADD COLUMN condicion_comercial_4 TEXT DEFAULT 'Tiempo de entrega: 7-10 días hábiles',
ADD COLUMN condicion_comercial_5 TEXT DEFAULT NULL,
ADD COLUMN condicion_comercial_6 TEXT DEFAULT NULL;