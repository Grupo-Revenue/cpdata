
import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useNumberInput } from '@/hooks/useNumberInput';

interface ProductNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  allowEmpty?: boolean;
}

const ProductNumberInput: React.FC<ProductNumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step,
  className = "w-16 h-9 text-center text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/20",
  placeholder = "0",
  allowEmpty = false
}) => {
  const {
    displayValue,
    numericValue,
    handleChange,
    handleBlur,
    setValue
  } = useNumberInput({
    min,
    max,
    step,
    defaultValue: value,
    allowEmpty,
    onValueChange: (newValue) => {
      // Only call onChange if we have a valid number or if empty is allowed
      if (newValue !== null) {
        onChange(newValue);
      } else if (allowEmpty) {
        // For empty values, use the minimum value or 0 as fallback
        onChange(min ?? 0);
      }
    }
  });

  // Sync with external value changes
  useEffect(() => {
    if (value !== numericValue) {
      setValue(value);
    }
  }, [value, numericValue, setValue]);

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={displayValue}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      className={`${className} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      placeholder={placeholder}
      style={{ MozAppearance: 'textfield' }}
    />
  );
};

export default ProductNumberInput;
