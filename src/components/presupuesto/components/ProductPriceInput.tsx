
import React from 'react';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

interface ProductPriceInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const ProductPriceInput: React.FC<ProductPriceInputProps> = ({
  value,
  onChange,
  className = "w-28 h-9 text-center text-sm pl-7 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
}) => {
  const formatearNumeroConSeparadores = (numero: number): string => {
    return new Intl.NumberFormat('es-CL').format(numero);
  };

  const parsearNumeroConSeparadores = (valor: string): number => {
    const numeroLimpio = valor.replace(/\./g, '');
    return parseInt(numeroLimpio) || 0;
  };

  const handlePriceChange = (value: string) => {
    const valorLimpio = value.replace(/[^\d.]/g, '');
    
    if (valorLimpio === '') {
      onChange(0);
      return;
    }
    
    const numeroValue = parsearNumeroConSeparadores(valorLimpio);
    if (!isNaN(numeroValue)) {
      onChange(numeroValue);
    }
  };

  const handlePrecioKeyPress = (e: React.KeyboardEvent) => {
    if (!/[\d.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative inline-block">
      <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
      <Input
        type="text"
        value={value === 0 ? '' : formatearNumeroConSeparadores(value)}
        onChange={(e) => handlePriceChange(e.target.value)}
        onKeyDown={handlePrecioKeyPress}
        className={`${className} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        placeholder="0"
        style={{ MozAppearance: 'textfield' }}
      />
    </div>
  );
};

export default ProductPriceInput;
