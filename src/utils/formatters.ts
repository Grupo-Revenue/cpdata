
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

export const stripHtml = (html: string, maxLength?: number): string => {
  if (!html) return '';
  
  try {
    // Crear un elemento temporal para extraer solo el texto
    const temp = document.createElement('div');
    temp.innerHTML = html;
    let text = temp.textContent || temp.innerText || '';
    
    // Limpiar caracteres especiales y espacios extra
    text = text.replace(/\s+/g, ' ').trim();
    
    // Remover caracteres que pueden causar problemas en PDF
    text = text.replace(/[^\w\s\-.,;:()áéíóúüñÁÉÍÓÚÜÑ]/g, '');
    
    // Aplicar truncamiento si se especifica
    if (maxLength && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    
    return text;
  } catch (error) {
    console.error('Error processing HTML:', error);
    return html.replace(/<[^>]*>/g, '').substring(0, maxLength || 100);
  }
};
