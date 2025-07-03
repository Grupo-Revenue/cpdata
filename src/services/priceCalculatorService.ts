import { supabase } from '@/integrations/supabase/client';
import { AccreditationPrices } from '@/types/priceCalculator.types';
import { DEFAULT_PRICES } from '@/constants/priceCalculator.constants';

export const fetchAccreditationPrices = async (): Promise<AccreditationPrices> => {
  // Get the Acreditación product line ID
  const { data: lineaData, error: lineaError } = await supabase
    .from('lineas_producto')
    .select('id')
    .eq('nombre', 'Acreditación')
    .eq('activo', true)
    .single();

  if (lineaError) throw lineaError;
  if (!lineaData) throw new Error('Línea de producto Acreditación no encontrada');

  // Fetch products from that line
  const { data: productos, error: productosError } = await supabase
    .from('productos_biblioteca')
    .select('nombre, precio_base')
    .eq('linea_producto_id', lineaData.id)
    .eq('activo', true);

  if (productosError) throw productosError;

  // Map products to our price structure
  const priceMap: Partial<AccreditationPrices> = {};
  
  productos?.forEach(producto => {
    const nombre = producto.nombre.toLowerCase();
    if (nombre.includes('acreditador')) {
      priceMap.acreditador = producto.precio_base;
    } else if (nombre.includes('supervisor')) {
      priceMap.supervisor = producto.precio_base;
    }
  });

  // Use default values if not found in database
  return {
    acreditador: priceMap.acreditador || DEFAULT_PRICES.acreditador,
    supervisor: priceMap.supervisor || DEFAULT_PRICES.supervisor,
  };
};