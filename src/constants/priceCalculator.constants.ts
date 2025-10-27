import { PriceCalculatorInputs } from '@/types/priceCalculator.types';

export const DEFAULT_CALCULATOR_VALUES: PriceCalculatorInputs = {
  attendees: 0,
  distributionPercentages: {
    manual: 50,
    expressQR: 50,
  },
  accreditationCapacity: {
    manual: 75,
    expressQR: 95,
  },
};

export const DEFAULT_PRICES = {
  acreditador: 50000,
  supervisor: 70000,
};