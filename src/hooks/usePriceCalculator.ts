
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PriceCalculatorInputs {
  attendees: number;
  distributionPercentages: {
    manual: number;
    expressQR: number;
  };
  accreditationCapacity: {
    manual: number;
    expressQR: number;
  };
}

export interface PriceCalculatorResult {
  totalPrice: number;
  breakdown: {
    acreditadores: { quantity: number; unitPrice: number; total: number };
    supervisores: { quantity: number; unitPrice: number; total: number };
  };
  distributionSummary: {
    manualAttendees: number;
    expressQRAttendees: number;
    manualAccreditors: number;
    expressQRAccreditors: number;
    totalAccreditors: number;
    supervisors: number;
  };
}

interface AccreditationPrices {
  acreditador: number;
  supervisor: number;
}

const DEFAULT_VALUES: PriceCalculatorInputs = {
  attendees: 0,
  distributionPercentages: {
    manual: 50,
    expressQR: 50,
  },
  accreditationCapacity: {
    manual: 100,
    expressQR: 150,
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
        if (nombre.includes('acreditador')) {
          priceMap.acreditador = producto.precio_base;
        } else if (nombre.includes('supervisor')) {
          priceMap.supervisor = producto.precio_base;
        }
      });

      // Use default values if not found in database
      const finalPrices: AccreditationPrices = {
        acreditador: priceMap.acreditador || 50000,
        supervisor: priceMap.supervisor || 70000,
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
        acreditador: 50000,
        supervisor: 70000,
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

  const updateAccreditationCapacity = useCallback((
    type: keyof PriceCalculatorInputs['accreditationCapacity'],
    value: number
  ) => {
    setInputs(prev => ({
      ...prev,
      accreditationCapacity: {
        ...prev.accreditationCapacity,
        [type]: Math.max(1, value)
      }
    }));
  }, []);

  const calculatePrice = useCallback((): PriceCalculatorResult => {
    if (!prices) {
      throw new Error('Precios no cargados');
    }

    const { attendees, distributionPercentages, accreditationCapacity } = inputs;

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

    // Calculate attendees by distribution
    const manualAttendees = Math.ceil((attendees * adjustedPercentages.manual) / 100);
    const expressQRAttendees = Math.ceil((attendees * adjustedPercentages.expressQR) / 100);

    // Calculate required accreditors based on capacity
    const manualAccreditors = Math.ceil(manualAttendees / accreditationCapacity.manual);
    const expressQRAccreditors = Math.ceil(expressQRAttendees / accreditationCapacity.expressQR);
    const totalAccreditors = manualAccreditors + expressQRAccreditors;

    // Calculate supervisors (1 supervisor per 5 accreditors, minimum 1)
    const supervisors = Math.max(1, Math.ceil(totalAccreditors / 5));

    // Calculate totals
    const acreditadoresTotal = totalAccreditors * prices.acreditador;
    const supervisoresTotal = supervisors * prices.supervisor;
    const totalPrice = acreditadoresTotal + supervisoresTotal;

    const calculationResult: PriceCalculatorResult = {
      totalPrice,
      breakdown: {
        acreditadores: {
          quantity: totalAccreditors,
          unitPrice: prices.acreditador,
          total: acreditadoresTotal
        },
        supervisores: {
          quantity: supervisors,
          unitPrice: prices.supervisor,
          total: supervisoresTotal
        }
      },
      distributionSummary: {
        manualAttendees,
        expressQRAttendees,
        manualAccreditors,
        expressQRAccreditors,
        totalAccreditors,
        supervisors
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
    updateAccreditationCapacity,
    calculatePrice,
    resetCalculator,
    refetchPrices: fetchPrices
  };
};
