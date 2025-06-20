
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AlertCircle, Check } from 'lucide-react';

interface EnhancedNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  showValidation?: boolean;
  currency?: boolean;
}

const EnhancedNumberInput: React.FC<EnhancedNumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = "0",
  className,
  showValidation = true,
  currency = false
}) => {
  const [inputValue, setInputValue] = useState<string>(value === 0 ? '' : value.toString());
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value === 0 ? '' : value.toString());
    }
  }, [value, isFocused]);

  const validateAndUpdate = (newValue: string) => {
    if (newValue === '') {
      setIsValid(true);
      onChange(0);
      return;
    }

    const numericValue = parseFloat(newValue);
    const valid = !isNaN(numericValue) && numericValue >= min && (max === undefined || numericValue <= max);
    
    setIsValid(valid);
    
    if (valid) {
      onChange(numericValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    validateAndUpdate(newValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue === '' || !isValid) {
      setInputValue(value === 0 ? '' : value.toString());
      setIsValid(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className="relative">
      <Input
        type="number"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={cn(
          "transition-all duration-200",
          !isValid && "border-red-500 focus:border-red-500",
          isValid && value > 0 && "border-green-500",
          currency && "text-right",
          className
        )}
      />
      {showValidation && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {!isValid && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          {isValid && value > 0 && (
            <Check className="w-4 h-4 text-green-500" />
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedNumberInput;
