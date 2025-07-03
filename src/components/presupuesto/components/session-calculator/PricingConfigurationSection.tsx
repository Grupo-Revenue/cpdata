import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';
import { PriceCalculatorInputs, AccreditationPrices } from '@/types/priceCalculator.types';

interface PricingConfigurationSectionProps {
  inputs: PriceCalculatorInputs;
  prices: AccreditationPrices | null;
  onCustomPriceChange: (type: 'acreditador' | 'supervisor', value: number) => void;
}

export const PricingConfigurationSection: React.FC<PricingConfigurationSectionProps> = ({
  inputs,
  prices,
  onCustomPriceChange
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Precios Unitarios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Label className="text-sm font-medium">Precios Personalizados</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Deja vacío para usar precios por defecto
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="price-acreditador" className="text-xs">Acreditador</Label>
            <Input
              id="price-acreditador"
              type="number"
              min="0"
              value={inputs.customPrices?.acreditador || ''}
              placeholder={prices ? `${prices.acreditador}` : '50000'}
              onChange={(e) => onCustomPriceChange('acreditador', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="price-supervisor" className="text-xs">Supervisor</Label>
            <Input
              id="price-supervisor"
              type="number"
              min="0"
              value={inputs.customPrices?.supervisor || ''}
              placeholder={prices ? `${prices.supervisor}` : '70000'}
              onChange={(e) => onCustomPriceChange('supervisor', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};