
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
    // Remove style attributes and other problematic HTML
    let cleanHtml = html
      .replace(/style="[^"]*"/gi, '') // Remove style attributes
      .replace(/class="[^"]*"/gi, '') // Remove class attributes
      .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
      .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
      .replace(/&nbsp;/gi, ' ') // Replace &nbsp; with regular space
      .replace(/&amp;/gi, '&') // Replace &amp; with &
      .replace(/&lt;/gi, '<') // Replace &lt; with <
      .replace(/&gt;/gi, '>') // Replace &gt; with >
      .replace(/&quot;/gi, '"'); // Replace &quot; with "
    
    // Create temporary element to extract text
    const temp = document.createElement('div');
    temp.innerHTML = cleanHtml;
    let text = temp.textContent || temp.innerText || '';
    
    // Clean special characters and extra spaces
    text = text
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[\r\n\t]/g, ' ') // Line breaks and tabs to space
      .trim();
    
    // Remove characters that can cause PDF problems, but keep more useful ones
    text = text.replace(/[^\w\s\-.,;:()áéíóúüñÁÉÍÓÚÜÑ¿¡°%$&+=/]/g, '');
    
    // Apply truncation if specified
    if (maxLength && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    
    return text || 'Sin descripción';
  } catch (error) {
    console.error('Error processing HTML:', error);
    // Emergency fallback
    const fallback = html
      .replace(/<[^>]*>/g, '') // Strip all HTML tags
      .replace(/&[^;]+;/g, '') // Remove HTML entities
      .replace(/\s+/g, ' ') // Clean whitespace
      .trim();
    return fallback.substring(0, maxLength || 100) || 'Sin descripción';
  }
};
