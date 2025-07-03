import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { PriceCalculatorInputs } from '@/types/priceCalculator.types';

interface EventConfigurationSectionProps {
  inputs: PriceCalculatorInputs;
  onUpdateInput: <K extends keyof PriceCalculatorInputs>(
    key: K,
    value: PriceCalculatorInputs[K]
  ) => void;
  onDistributionChange: (type: 'manual' | 'expressQR', value: number) => void;
  onCapacityChange: (type: 'manual' | 'expressQR', value: number) => void;
}

export const EventConfigurationSection: React.FC<EventConfigurationSectionProps> = ({
  inputs,
  onUpdateInput,
  onDistributionChange,
  onCapacityChange
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Configuración del Evento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="attendees" className="text-sm">Cantidad de Asistentes</Label>
          <Input
            id="attendees"
            type="number"
            min="0"
            value={inputs.attendees}
            onChange={(e) => onUpdateInput('attendees', parseInt(e.target.value) || 0)}
            placeholder="Ingrese el número de asistentes"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium">Distribución (%)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Se ajustan automáticamente para sumar 100%
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="manual-percentage" className="text-xs">Manual</Label>
              <Input
                id="manual-percentage"
                type="number"
                min="0"
                max="100"
                value={inputs.distributionPercentages.manual}
                onChange={(e) => onDistributionChange('manual', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="express-percentage" className="text-xs">Express QR</Label>
              <Input
                id="express-percentage"
                type="number"
                min="0"
                max="100"
                value={inputs.distributionPercentages.expressQR}
                onChange={(e) => onDistributionChange('expressQR', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Capacidad por Acreditador</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Asistentes que puede atender cada uno
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="manual-capacity" className="text-xs">Manual</Label>
              <Input
                id="manual-capacity"
                type="number"
                min="1"
                value={inputs.accreditationCapacity.manual}
                onChange={(e) => onCapacityChange('manual', parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="express-capacity" className="text-xs">Express QR</Label>
              <Input
                id="express-capacity"
                type="number"
                min="1"
                value={inputs.accreditationCapacity.expressQR}
                onChange={(e) => onCapacityChange('expressQR', parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};