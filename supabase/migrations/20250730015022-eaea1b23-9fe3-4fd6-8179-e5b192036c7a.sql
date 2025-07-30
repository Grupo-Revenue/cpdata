-- Create table for budget terms configuration
CREATE TABLE public.budget_terms_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Commercial conditions section
  validez_oferta text NOT NULL DEFAULT '30 días calendario',
  forma_pago text NOT NULL DEFAULT '50% anticipo, 50% contra entrega',
  tiempo_entrega text NOT NULL DEFAULT '7-10 días hábiles',
  moneda text NOT NULL DEFAULT 'Pesos Chilenos (CLP)',
  precios_incluyen text NOT NULL DEFAULT 'Incluyen IVA',
  
  -- Observations section
  observacion_1 text NOT NULL DEFAULT 'Los precios incluyen configuración e instalación del sistema',
  observacion_2 text NOT NULL DEFAULT 'Incluye capacitación al personal operativo',
  observacion_3 text NOT NULL DEFAULT 'Soporte técnico durante el evento las 24 horas',
  observacion_4 text NOT NULL DEFAULT 'Garantía de funcionamiento durante todo el evento',
  observacion_5 text NOT NULL DEFAULT 'Los equipos quedan en comodato durante el evento',
  observacion_6 text NOT NULL DEFAULT 'Se requiere conexión a internet estable en el lugar',
  
  -- Footer terms section
  terminos_pago_entrega text NOT NULL DEFAULT 'Los precios incluyen IVA y están expresados en pesos chilenos\n• Este presupuesto tiene validez de 30 días desde la fecha de emisión\n• Forma de pago: 50% anticipo, 50% contra entrega\n• Tiempo de entrega: 7-10 días hábiles desde confirmación del pedido',
  terminos_garantias text NOT NULL DEFAULT 'Garantía de 12 meses en equipos y 6 meses en servicios\n• Soporte técnico 24/7 durante el evento\n• Capacitación incluida para el uso de los sistemas\n• Los servicios se ejecutarán según especificaciones técnicas acordadas',
  certificacion_texto text NOT NULL DEFAULT 'Empresa certificada en normas ISO 9001:2015 | Registrada en ChileCompra',
  documento_texto text NOT NULL DEFAULT 'Este documento constituye una propuesta comercial sujeta a aceptación formal'
);

-- Enable RLS
ALTER TABLE public.budget_terms_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Solo admins pueden modificar configuración de términos" 
ON public.budget_terms_config 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Todos pueden ver configuración de términos" 
ON public.budget_terms_config 
FOR SELECT 
USING (true);

-- Insert default configuration
INSERT INTO public.budget_terms_config (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Create function to update timestamps
CREATE TRIGGER update_budget_terms_config_updated_at
BEFORE UPDATE ON public.budget_terms_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();