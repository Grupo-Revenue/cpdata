
/**
 * Utilidades para cálculos de IVA y validaciones
 */

export const IVA_RATE = 0.19; // 19% IVA en Chile

export const calcularSubtotal = (total: number): number => {
  return total / (1 + IVA_RATE);
};

export const calcularIVA = (subtotal: number): number => {
  return subtotal * IVA_RATE;
};

export const calcularTotalConIVA = (subtotal: number): number => {
  return subtotal * (1 + IVA_RATE);
};

export const formatearPrecioConAnimacion = (precio: number, previousPrice?: number): { 
  formatted: string; 
  shouldAnimate: boolean 
} => {
  const formatted = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);

  return {
    formatted,
    shouldAnimate: previousPrice !== undefined && previousPrice !== precio
  };
};

export const validarNumeroPositivo = (value: string): { 
  isValid: boolean; 
  numericValue: number; 
  errorMessage?: string 
} => {
  if (value === '') {
    return { isValid: true, numericValue: 0 };
  }

  const numericValue = parseFloat(value);
  
  if (isNaN(numericValue)) {
    return { 
      isValid: false, 
      numericValue: 0, 
      errorMessage: 'Debe ser un número válido' 
    };
  }

  if (numericValue < 0) {
    return { 
      isValid: false, 
      numericValue: 0, 
      errorMessage: 'Debe ser un número positivo' 
    };
  }

  return { isValid: true, numericValue };
};
