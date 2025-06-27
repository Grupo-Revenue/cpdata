import { useState, useCallback } from 'react';

interface UseNumberInputOptions {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  allowEmpty?: boolean;
  onValueChange?: (value: number | null) => void;
}

export const useNumberInput = ({
  min,
  max,
  step = 1,
  defaultValue = 0,
  allowEmpty = true,
  onValueChange
}: UseNumberInputOptions = {}) => {
  const [displayValue, setDisplayValue] = useState<string>(defaultValue.toString());
  const [numericValue, setNumericValue] = useState<number | null>(defaultValue);

  const handleChange = useCallback((inputValue: string) => {
    // Allow empty input if enabled
    if (inputValue === '' && allowEmpty) {
      setDisplayValue('');
      setNumericValue(null);
      onValueChange?.(null);
      return;
    }

    // Parse the numeric value
    const parsed = parseFloat(inputValue);
    
    // If it's not a valid number, keep the display value but don't update numeric
    if (isNaN(parsed)) {
      setDisplayValue(inputValue);
      return;
    }

    // Apply constraints
    let constrainedValue = parsed;
    if (min !== undefined) constrainedValue = Math.max(min, constrainedValue);
    if (max !== undefined) constrainedValue = Math.min(max, constrainedValue);

    setDisplayValue(inputValue);
    setNumericValue(constrainedValue);
    onValueChange?.(constrainedValue);
  }, [min, max, allowEmpty, onValueChange]);

  const handleBlur = useCallback(() => {
    // On blur, if empty and not allowed, set to default
    if (displayValue === '' && !allowEmpty) {
      const fallbackValue = defaultValue;
      setDisplayValue(fallbackValue.toString());
      setNumericValue(fallbackValue);
      onValueChange?.(fallbackValue);
    } else if (numericValue !== null && displayValue !== numericValue.toString()) {
      // Sync display with actual numeric value
      setDisplayValue(numericValue.toString());
    }
  }, [displayValue, numericValue, allowEmpty, defaultValue, onValueChange]);

  const setValue = useCallback((value: number | null) => {
    if (value === null && allowEmpty) {
      setDisplayValue('');
      setNumericValue(null);
    } else {
      const numValue = value ?? defaultValue;
      setDisplayValue(numValue.toString());
      setNumericValue(numValue);
    }
  }, [allowEmpty, defaultValue]);

  return {
    displayValue,
    numericValue,
    handleChange,
    handleBlur,
    setValue
  };
};
