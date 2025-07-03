import { useState, useCallback } from 'react';

interface PhoneValidationResult {
  isValid: boolean;
  formattedValue: string;
  error?: string;
}

export const useChileanPhoneValidator = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string>('');

  const formatChileanPhone = useCallback((input: string): PhoneValidationResult => {
    // Remove all non-digit characters except +
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +56
    if (!cleaned.startsWith('+56')) {
      if (cleaned.startsWith('56')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('9') || /^[2-7]/.test(cleaned)) {
        cleaned = '+56' + cleaned;
      } else if (cleaned.length > 0 && !cleaned.startsWith('+')) {
        cleaned = '+56' + cleaned;
      } else if (cleaned.length === 0) {
        cleaned = '+56';
      }
    }

    // Extract the number part after +56
    const numberPart = cleaned.slice(3);
    
    let formatted = '+56';
    let isValid = false;
    let errorMessage = '';

    if (numberPart.length === 0) {
      return { isValid: false, formattedValue: formatted, error: '' };
    }

    // Mobile phone format: +56 9 XXXX XXXX
    if (numberPart.startsWith('9')) {
      if (numberPart.length <= 1) {
        formatted = '+56 9';
      } else if (numberPart.length <= 5) {
        formatted = `+56 9 ${numberPart.slice(1)}`;
      } else if (numberPart.length <= 9) {
        formatted = `+56 9 ${numberPart.slice(1, 5)} ${numberPart.slice(5)}`;
      } else {
        // Truncate if too long
        const truncated = numberPart.slice(0, 9);
        formatted = `+56 9 ${truncated.slice(1, 5)} ${truncated.slice(5)}`;
      }
      
      isValid = numberPart.length === 9;
      if (!isValid && numberPart.length > 1) {
        errorMessage = 'Teléfono móvil debe tener 8 dígitos después del 9';
      }
    }
    // Fixed phone format: +56 X XXXX XXXX (area codes 2-7)
    else if (/^[2-7]/.test(numberPart)) {
      if (numberPart.length <= 1) {
        formatted = `+56 ${numberPart}`;
      } else if (numberPart.length <= 5) {
        formatted = `+56 ${numberPart.slice(0, 1)} ${numberPart.slice(1)}`;
      } else if (numberPart.length <= 9) {
        formatted = `+56 ${numberPart.slice(0, 1)} ${numberPart.slice(1, 5)} ${numberPart.slice(5)}`;
      } else {
        // Truncate if too long
        const truncated = numberPart.slice(0, 9);
        formatted = `+56 ${truncated.slice(0, 1)} ${truncated.slice(1, 5)} ${truncated.slice(5)}`;
      }
      
      isValid = numberPart.length === 9;
      if (!isValid && numberPart.length > 1) {
        errorMessage = 'Teléfono fijo debe tener 8 dígitos después del código de área';
      }
    }
    // Invalid format
    else {
      if (numberPart.length > 0) {
        errorMessage = 'Número inválido. Use 9 para móviles o 2-7 para fijos';
      }
      formatted = '+56 ' + numberPart;
    }

    return {
      isValid,
      formattedValue: formatted,
      error: errorMessage
    };
  }, []);

  const handleChange = useCallback((inputValue: string) => {
    const result = formatChileanPhone(inputValue);
    setValue(result.formattedValue);
    setError(result.error || '');
    return result;
  }, [formatChileanPhone]);

  const validate = useCallback((inputValue?: string) => {
    const valueToValidate = inputValue ?? value;
    const result = formatChileanPhone(valueToValidate);
    setError(result.error || '');
    return result.isValid;
  }, [value, formatChileanPhone]);

  const reset = useCallback(() => {
    setValue('+56');
    setError('');
  }, []);

  return {
    value,
    error,
    handleChange,
    validate,
    reset,
    isValid: error === '' && value.length > 3
  };
};