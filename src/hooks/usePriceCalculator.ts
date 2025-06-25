
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PriceCalculatorInputs {
  attendees: number;
  distributionPercentages: {
    manual: number;
    expressQR: number;
  };
}

export interface PriceCalculatorResult {
  totalPrice: number;
  breakdown: {
    credencial: { quantity: number; unitPrice: number; total: number };
    cordon: { quantity: number; unitPrice: number; total: number };
    portaCredencial: { quantity: number; unitPrice: number; total: number };
  };
  distributionSummary: {
    manualAttendees: number;
    expressQRAttendees: number;
  };
}

interface AccreditationPrices {
  credencial: number;
  cordon: number;
  portaCredencial: number;
}

const DEFAULT_VALUES: PriceCalculatorInputs = {
  attendees: 0,
  distributionPercentages: {
    manual: 50,
    expressQR: 50,
  },
};

export const usePriceCalculator = () => {
  const [inputs, setInputs] = useState<PriceCalculatorInputs>(DEFAULT_VALUES);
  const [result, setResult] = useState<PriceCalculatorResult | null>(null);
  const [prices, setPrices] = useState<AccreditationPrices | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch prices from database
  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      
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
        if (nombre.includes('credencial') && !nombre.includes('porta')) {
          priceMap.credencial = producto.precio_base;
        } else if (nombre.includes('cordón') || nombre.includes('cordon')) {
          priceMap.cordon = producto.precio_base;
        } else if (nombre.includes('porta')) {
          priceMap.portaCredencial = producto.precio_base;
        }
      });

      // Use default values if not found in database
      const finalPrices: AccreditationPrices = {
        credencial: priceMap.credencial || 1500,
        cordon: priceMap.cordon || 300,
        portaCredencial: priceMap.portaCredencial || 500,
      };

      setPrices(finalPrices);
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los precios. Se usarán valores por defecto.",
        variant: "destructive"
      });
      
      // Use default prices
      setPrices({
        credencial: 1500,
        cordon: 300,
        portaCredencial: 500,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const updateInput = useCallback(<K extends keyof PriceCalculatorInputs>(
    key: K,
    value: PriceCalculatorInputs[K]
  ) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateDistributionPercentage = useCallback((
    type: keyof PriceCalculatorInputs['distributionPercentages'],
    value: number
  ) => {
    setInputs(prev => ({
      ...prev,
      distributionPercentages: {
        ...prev.distributionPercentages,
        [type]: Math.max(0, Math.min(100, value))
      }
    }));
  }, []);

  const calculatePrice = useCallback((): PriceCalculatorResult => {
    if (!prices) {
      throw new Error('Precios no cargados');
    }

    const { attendees, distributionPercentages } = inputs;

    // Ensure percentages add up to 100%
    const totalPercentage = distributionPercentages.manual + distributionPercentages.expressQR;
    let adjustedPercentages = { ...distributionPercentages };
    
    if (totalPercentage !== 100 && totalPercentage > 0) {
      // Normalize percentages to add up to 100%
      adjustedPercentages.manual = (distributionPercentages.manual / totalPercentage) * 100;
      adjustedPercentages.expressQR = (distributionPercentages.expressQR / totalPercentage) * 100;
    } else if (totalPercentage === 0) {
      // Default to 50/50 if both are 0
      adjustedPercentages.manual = 50;
      adjustedPercentages.expressQR = 50;
    }

    // Calculate quantities based on attendees and distribution
    const manualAttendees = Math.ceil((attendees * adjustedPercentages.manual) / 100);
    const expressQRAttendees = Math.ceil((attendees * adjustedPercentages.expressQR) / 100);

    // Based on Excel logic:
    // - Manual: 1 credencial + 1 cordon + 1 porta per attendee
    // - Express QR: 1 credencial + 1 cordon per attendee (no porta needed)
    const credencialQty = manualAttendees + expressQRAttendees;
    const cordonQty = manualAttendees + expressQRAttendees;
    const portaCredencialQty = manualAttendees; // Only for manual attendees

    // Calculate totals for each item
    const credencialTotal = credencialQty * prices.credencial;
    const cordonTotal = cordonQty * prices.cordon;
    const portaCredencialTotal = portaCredencialQty * prices.portaCredencial;

    // Calculate final total price
    const totalPrice = credencialTotal + cordonTotal + portaCredencialTotal;

    const calculationResult: PriceCalculatorResult = {
      totalPrice,
      breakdown: {
        credencial: {
          quantity: credencialQty,
          unitPrice: prices.credencial,
          total: credencialTotal
        },
        cordon: {
          quantity: cordonQty,
          unitPrice: prices.cordon,
          total: cordonTotal
        },
        portaCredencial: {
          quantity: portaCredencialQty,
          unitPrice: prices.portaCredencial,
          total: portaCredencialTotal
        }
      },
      distributionSummary: {
        manualAttendees,
        expressQRAttendees
      }
    };

    setResult(calculationResult);
    return calculationResult;
  }, [inputs, prices]);

  const resetCalculator = useCallback(() => {
    setInputs(DEFAULT_VALUES);
    setResult(null);
  }, []);

  return {
    inputs,
    result,
    prices,
    loading,
    updateInput,
    updateDistributionPercentage,
    calculatePrice,
    resetCalculator,
    refetchPrices: fetchPrices
  };
};
