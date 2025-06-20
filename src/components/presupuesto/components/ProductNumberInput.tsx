
import React from 'react';
import { Input } from '@/components/ui/input';

interface ProductNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
}

const ProductNumberInput: React.FC<ProductNumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step,
  className = "w-16 h-9 text-center text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/20",
  placeholder = "0"
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseFloat(e.target.value) || 0;
    
    if (min !== undefined) newValue = Math.max(min, newValue);
    if (max !== undefined) newValue = Math.min(max, newValue);
    
    onChange(newValue);
  };

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      className={`${className} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      placeholder={placeholder}
      style={{ MozAppearance: 'textfield' }}
    />
  );
};

export default ProductNumberInput;
