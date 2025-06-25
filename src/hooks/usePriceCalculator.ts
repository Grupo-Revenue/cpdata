
import { useState, useCallback } from 'react';

export interface PriceCalculatorInputs {
  attendees: number;
  manualPrice: number;
  distributionPercentages: {
    credencial: number;
    cordon: number;
    portaCredencial: number;
  };
  accreditationValues: {
    credencial: number;
    cordon: number;
    portaCredencial: number;
  };
}

export interface PriceCalculatorResult {
  totalPrice: number;
  breakdown: {
    credencial: { quantity: number; unitPrice: number; total: number };
    cordon: { quantity: number; unitPrice: number; total: number };
    portaCredencial: { quantity: number; unitPrice: number; total: number };
  };
}

const DEFAULT_VALUES: PriceCalculatorInputs = {
  attendees: 0,
  manualPrice: 0,
  distributionPercentages: {
    credencial: 100,
    cordon: 100,
    portaCredencial: 100,
  },
  accreditationValues: {
    credencial: 1500,
    cordon: 300,
    portaCredencial: 500,
  },
};

export const usePriceCalculator = () => {
  const [inputs, setInputs] = useState<PriceCalculatorInputs>(DEFAULT_VALUES);
  const [result, setResult] = useState<PriceCalculatorResult | null>(null);

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

  const updateAccreditationValue = useCallback((
    type: keyof PriceCalculatorInputs['accreditationValues'],
    value: number
  ) => {
    setInputs(prev => ({
      ...prev,
      accreditationValues: {
        ...prev.accreditationValues,
        [type]: Math.max(0, value)
      }
    }));
  }, []);

  const calculatePrice = useCallback((): PriceCalculatorResult => {
    const { attendees, distributionPercentages, accreditationValues } = inputs;

    // Calculate quantities based on attendees and distribution percentages
    const credencialQty = Math.ceil((attendees * distributionPercentages.credencial) / 100);
    const cordonQty = Math.ceil((attendees * distributionPercentages.cordon) / 100);
    const portaCredencialQty = Math.ceil((attendees * distributionPercentages.portaCredencial) / 100);

    // Calculate totals for each item
    const credencialTotal = credencialQty * accreditationValues.credencial;
    const cordonTotal = cordonQty * accreditationValues.cordon;
    const portaCredencialTotal = portaCredencialQty * accreditationValues.portaCredencial;

    // Calculate final total price
    const totalPrice = credencialTotal + cordonTotal + portaCredencialTotal;

    const calculationResult: PriceCalculatorResult = {
      totalPrice,
      breakdown: {
        credencial: {
          quantity: credencialQty,
          unitPrice: accreditationValues.credencial,
          total: credencialTotal
        },
        cordon: {
          quantity: cordonQty,
          unitPrice: accreditationValues.cordon,
          total: cordonTotal
        },
        portaCredencial: {
          quantity: portaCredencialQty,
          unitPrice: accreditationValues.portaCredencial,
          total: portaCredencialTotal
        }
      }
    };

    setResult(calculationResult);
    return calculationResult;
  }, [inputs]);

  const resetCalculator = useCallback(() => {
    setInputs(DEFAULT_VALUES);
    setResult(null);
  }, []);

  return {
    inputs,
    result,
    updateInput,
    updateDistributionPercentage,
    updateAccreditationValue,
    calculatePrice,
    resetCalculator
  };
};
