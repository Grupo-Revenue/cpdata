
import { useState, useCallback } from 'react';

export interface PriceCalculatorInputs {
  attendees: number;
  distributionPercentages: {
    manual: number;
    expressQR: number;
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
  distributionPercentages: {
    manual: 50,
    expressQR: 50,
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

    // Ensure percentages add up to 100%
    const totalPercentage = distributionPercentages.manual + distributionPercentages.expressQR;
    if (totalPercentage === 0) {
      // Default to 50/50 if both are 0
      distributionPercentages.manual = 50;
      distributionPercentages.expressQR = 50;
    }

    // Calculate quantities based on attendees and distribution
    const manualAttendees = Math.ceil((attendees * distributionPercentages.manual) / 100);
    const expressQRAttendees = Math.ceil((attendees * distributionPercentages.expressQR) / 100);

    // Based on Excel logic:
    // - Manual: 1 credencial + 1 cordon + 1 porta per attendee
    // - Express QR: 1 credencial + 1 cordon per attendee (no porta needed)
    const credencialQty = manualAttendees + expressQRAttendees;
    const cordonQty = manualAttendees + expressQRAttendees;
    const portaCredencialQty = manualAttendees; // Only for manual attendees

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
