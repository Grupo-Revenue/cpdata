import { PriceCalculatorInputs, PriceCalculatorResult, AccreditationPrices } from '@/types/priceCalculator.types';

export const calculateAccreditationPrice = (
  inputs: PriceCalculatorInputs,
  prices: AccreditationPrices
): PriceCalculatorResult => {
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

  return {
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
};