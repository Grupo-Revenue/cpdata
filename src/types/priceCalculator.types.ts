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

export interface AccreditationPrices {
  acreditador: number;
  supervisor: number;
}