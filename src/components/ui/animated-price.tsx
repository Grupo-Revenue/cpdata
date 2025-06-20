
import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatearPrecio } from '@/utils/formatters';

interface AnimatedPriceProps {
  value: number;
  previousValue?: number;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AnimatedPrice: React.FC<AnimatedPriceProps> = ({
  value,
  previousValue,
  className,
  showIcon = true,
  size = 'md'
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value, previousValue]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn(
      "flex items-center space-x-1 font-medium text-green-600 transition-all duration-300",
      shouldAnimate && "animate-pulse scale-105",
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <DollarSign className={cn(iconSizes[size], "text-green-500")} />
      )}
      <span className={cn(
        "transition-all duration-300",
        shouldAnimate && "font-bold"
      )}>
        {formatearPrecio(value)}
      </span>
    </div>
  );
};

export default AnimatedPrice;
