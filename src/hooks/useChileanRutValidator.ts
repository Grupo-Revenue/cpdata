import { useState, useCallback } from 'react';

interface RutValidationResult {
  isValid: boolean;
  formattedValue: string;
  error?: string;
}

export const useChileanRutValidator = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string>('');

  // Función para calcular el dígito verificador
  const calculateDV = useCallback((rut: string): string => {
    let sum = 0;
    let multiplier = 2;
    
    // Procesar de derecha a izquierda
    for (let i = rut.length - 1; i >= 0; i--) {
      sum += parseInt(rut[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const dv = 11 - remainder;
    
    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
  }, []);

  const formatChileanRut = useCallback((input: string): RutValidationResult => {
    // Limpiar el input: solo números, K y k
    let cleaned = input.toUpperCase().replace(/[^0-9K]/g, '');
    
    if (cleaned.length === 0) {
      return { isValid: false, formattedValue: '', error: '' };
    }

    // Separar cuerpo y dígito verificador
    let body = '';
    let dv = '';
    
    if (cleaned.length === 1) {
      body = cleaned;
    } else {
      body = cleaned.slice(0, -1);
      dv = cleaned.slice(-1);
    }

    // Validar longitud del cuerpo (entre 7 y 8 dígitos para Chile)
    if (body.length > 8) {
      body = body.slice(0, 8);
    }

    // Formatear con puntos
    let formattedBody = body;
    if (body.length > 6) {
      formattedBody = body.slice(0, -6) + '.' + body.slice(-6, -3) + '.' + body.slice(-3);
    } else if (body.length > 3) {
      formattedBody = body.slice(0, -3) + '.' + body.slice(-3);
    }

    // Construir el RUT formateado
    let formatted = formattedBody;
    if (dv) {
      formatted += '-' + dv;
    }

    // Validación
    let isValid = false;
    let errorMessage = '';

    if (body.length >= 7 && dv) {
      // Validar que el cuerpo sean solo números
      if (!/^\d+$/.test(body)) {
        errorMessage = 'El cuerpo del RUT debe contener solo números';
      }
      // Validar longitud
      else if (body.length < 7 || body.length > 8) {
        errorMessage = 'RUT debe tener entre 7 y 8 dígitos';
      }
      // Validar dígito verificador
      else {
        const expectedDV = calculateDV(body);
        if (dv !== expectedDV) {
          errorMessage = `Dígito verificador incorrecto. Debería ser ${expectedDV}`;
        } else {
          isValid = true;
        }
      }
    } else if (body.length > 0 && body.length < 7) {
      errorMessage = 'RUT debe tener al menos 7 dígitos';
    } else if (body.length >= 7 && !dv) {
      errorMessage = 'Falta el dígito verificador';
    }

    return {
      isValid,
      formattedValue: formatted,
      error: errorMessage
    };
  }, [calculateDV]);

  const handleChange = useCallback((inputValue: string) => {
    const result = formatChileanRut(inputValue);
    setValue(result.formattedValue);
    setError(result.error || '');
    return result;
  }, [formatChileanRut]);

  const validate = useCallback((inputValue?: string) => {
    const valueToValidate = inputValue ?? value;
    const result = formatChileanRut(valueToValidate);
    setError(result.error || '');
    return result.isValid;
  }, [value, formatChileanRut]);

  const reset = useCallback(() => {
    setValue('');
    setError('');
  }, []);

  // Función auxiliar para obtener solo los números del RUT (sin formato)
  const getCleanRut = useCallback((rutValue?: string) => {
    const valueToClean = rutValue ?? value;
    return valueToClean.replace(/[^0-9K]/g, '');
  }, [value]);

  return {
    value,
    error,
    handleChange,
    validate,
    reset,
    getCleanRut,
    isValid: error === '' && value.length > 0
  };
};