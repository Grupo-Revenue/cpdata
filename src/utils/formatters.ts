
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
  
  // Crear un elemento temporal para extraer solo el texto
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.textContent || temp.innerText || '';
  
  // Aplicar truncamiento si se especifica
  if (maxLength && text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  
  return text;
};

/**
 * Formatea una fecha almacenada como string (YYYY-MM-DD) a formato local
 * sin aplicar conversión de zona horaria
 */
export const formatearFechaSinZonaHoraria = (fechaString: string): string => {
  if (!fechaString) return '';
  
  // Dividir la fecha en partes para evitar problemas de zona horaria
  const [year, month, day] = fechaString.split('T')[0].split('-');
  
  // Crear fecha en zona horaria local
  const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return fecha.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha en formato corto (DD/MM/YY)
 */
export const formatearFechaCorta = (fechaString: string): string => {
  if (!fechaString) return '';
  
  try {
    const [year, month, day] = fechaString.split('T')[0].split('-');
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  } catch (error) {
    return '';
  }
};

/**
 * Formatea una fecha en formato muy corto (DD/MM)
 */
export const formatearFechaMuyCorta = (fechaString: string): string => {
  if (!fechaString) return '';
  
  try {
    const [year, month, day] = fechaString.split('T')[0].split('-');
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit'
    });
  } catch (error) {
    return '';
  }
};

/**
 * Formatea un rango de fechas en formato DD-MM-YYYY | DD-MM-YYYY
 */
export const formatearRangoFechas = (fechaInicio: string | null, fechaFin?: string | null): string => {
  if (!fechaInicio) return 'Por definir';
  
  const formatearConGuiones = (fechaString: string): string => {
    try {
      const [year, month, day] = fechaString.split('T')[0].split('-');
      return `${day}-${month}-${year}`;
    } catch {
      return '';
    }
  };
  
  const fechaInicioFormateada = formatearConGuiones(fechaInicio);
  
  if (!fechaFin) {
    return fechaInicioFormateada;
  }
  
  const fechaFinFormateada = formatearConGuiones(fechaFin);
  return `${fechaInicioFormateada} | ${fechaFinFormateada}`;
};
