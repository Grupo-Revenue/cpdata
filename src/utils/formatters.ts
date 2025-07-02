
/**
 * Utilitarios para formatear precios y números en pesos chilenos
 */

export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);
};

export const formatearNumero = (numero: number): string => {
  return new Intl.NumberFormat('es-CL').format(numero);
};

export const parsearPrecio = (precioString: string): number => {
  // Remover símbolos de moneda y separadores de miles, convertir a número
  const numeroLimpio = precioString.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(numeroLimpio) || 0;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number): string => {
  return formatearPrecio(amount);
};
