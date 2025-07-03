import { useState, useCallback } from 'react';

interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export const useEmailValidator = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string>('');

  const validateEmail = useCallback((email: string): EmailValidationResult => {
    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return { isValid: false, error: '' };
    }

    if (!emailRegex.test(email)) {
      return { 
        isValid: false, 
        error: 'Ingresa un email válido (ej: usuario@dominio.com)' 
      };
    }

    // Additional validations
    if (email.length > 254) {
      return { 
        isValid: false, 
        error: 'Email demasiado largo (máximo 254 caracteres)' 
      };
    }

    // Check for consecutive dots
    if (email.includes('..')) {
      return { 
        isValid: false, 
        error: 'Email no puede contener puntos consecutivos' 
      };
    }

    // Check for valid characters
    const localPart = email.split('@')[0];
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return { 
        isValid: false, 
        error: 'Email no puede empezar o terminar con punto' 
      };
    }

    return { isValid: true };
  }, []);

  const handleChange = useCallback((inputValue: string) => {
    setValue(inputValue);
    const result = validateEmail(inputValue);
    setError(result.error || '');
    return result;
  }, [validateEmail]);

  const validate = useCallback((inputValue?: string) => {
    const valueToValidate = inputValue ?? value;
    const result = validateEmail(valueToValidate);
    setError(result.error || '');
    return result.isValid;
  }, [value, validateEmail]);

  const reset = useCallback(() => {
    setValue('');
    setError('');
  }, []);

  return {
    value,
    error,
    handleChange,
    validate,
    reset,
    isValid: error === '' && value.length > 0
  };
};