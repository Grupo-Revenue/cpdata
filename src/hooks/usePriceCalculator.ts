import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  PriceCalculatorInputs, 
  PriceCalculatorResult, 
  AccreditationPrices 
} from '@/types/priceCalculator.types';
import { DEFAULT_CALCULATOR_VALUES, DEFAULT_PRICES } from '@/constants/priceCalculator.constants';
import { fetchAccreditationPrices } from '@/services/priceCalculatorService';
import { calculateAccreditationPrice } from '@/utils/priceCalculatorLogic';

export const usePriceCalculator = () => {
  const [inputs, setInputs] = useState<PriceCalculatorInputs>(DEFAULT_CALCULATOR_VALUES);
  const [result, setResult] = useState<PriceCalculatorResult | null>(null);
  const [prices, setPrices] = useState<AccreditationPrices | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch prices from database
  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedPrices = await fetchAccreditationPrices();
      setPrices(fetchedPrices);
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los precios. Se usarán valores por defecto.",
        variant: "destructive"
      });
      
      // Use default prices
      setPrices(DEFAULT_PRICES);
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

  const updateCustomPrice = useCallback((
    type: keyof AccreditationPrices,
    value: number
  ) => {
    setInputs(prev => ({
      ...prev,
      customPrices: {
        ...prev.customPrices,
        acreditador: prev.customPrices?.acreditador || prices?.acreditador || DEFAULT_PRICES.acreditador,
        supervisor: prev.customPrices?.supervisor || prices?.supervisor || DEFAULT_PRICES.supervisor,
        [type]: Math.max(0, value)
      }
    }));
  }, [prices]);

  const calculatePrice = useCallback((): PriceCalculatorResult => {
    if (!prices) {
      throw new Error('Precios no cargados');
    }

    const calculationResult = calculateAccreditationPrice(inputs, prices);
    setResult(calculationResult);
    return calculationResult;
  }, [inputs, prices]);

  const resetCalculator = useCallback(() => {
    setInputs(DEFAULT_CALCULATOR_VALUES);
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
    updateCustomPrice,
    calculatePrice,
    resetCalculator,
    refetchPrices: fetchPrices
  };
};

// Re-export types for backward compatibility
export type { PriceCalculatorInputs, PriceCalculatorResult } from '@/types/priceCalculator.types';