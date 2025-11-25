import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCheck, DollarSign, Users } from 'lucide-react';
import { PriceCalculatorResult } from '@/types/priceCalculator.types';
import { formatearPrecio } from '@/utils/formatters';

interface EditableUnitPrices {
  acreditador: number;
  supervisor: number;
}

interface EditableQuantities {
  acreditadores: number;
  supervisores: number;
}

interface CalculationResultsCardProps {
  result: PriceCalculatorResult;
  editableUnitPrices: EditableUnitPrices;
  editableQuantities: EditableQuantities;
  onUnitPriceChange: (prices: EditableUnitPrices) => void;
  onQuantityChange: (quantities: EditableQuantities) => void;
  editableTotal: number;
}

export const CalculationResultsCard: React.FC<CalculationResultsCardProps> = ({ 
  result,
  editableUnitPrices,
  editableQuantities,
  onUnitPriceChange,
  onQuantityChange,
  editableTotal
}) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Resultado del Cálculo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Distribución de Asistentes */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-medium mb-1">Distribución de Asistentes</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manual:</span>
                <span>{result.distributionSummary.manualAttendees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Express QR:</span>
                <span>{result.distributionSummary.expressQRAttendees}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="font-medium mb-1">Personal Calculado</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acreditadores:</span>
                <span>{result.distributionSummary.totalAccreditors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supervisores:</span>
                <span>{result.distributionSummary.supervisors}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Editable - Cantidades Finales */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Cantidades Finales (Editable)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Acreditadores</Label>
              <Input
                type="number"
                min={0}
                value={editableQuantities.acreditadores}
                onChange={(e) => onQuantityChange({
                  ...editableQuantities,
                  acreditadores: parseInt(e.target.value) || 0
                })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Supervisores</Label>
              <Input
                type="number"
                min={0}
                value={editableQuantities.supervisores}
                onChange={(e) => onQuantityChange({
                  ...editableQuantities,
                  supervisores: parseInt(e.target.value) || 0
                })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Sección Editable - Precios Unitarios */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Precios Unitarios (Editable)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Precio Acreditador</Label>
              <Input
                type="number"
                min={0}
                value={editableUnitPrices.acreditador}
                onChange={(e) => onUnitPriceChange({
                  ...editableUnitPrices,
                  acreditador: parseInt(e.target.value) || 0
                })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Precio Supervisor</Label>
              <Input
                type="number"
                min={0}
                value={editableUnitPrices.supervisor}
                onChange={(e) => onUnitPriceChange({
                  ...editableUnitPrices,
                  supervisor: parseInt(e.target.value) || 0
                })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Resumen de Costos */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="text-xs space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Acreditadores ({editableQuantities.acreditadores} × {formatearPrecio(editableUnitPrices.acreditador)}):</span>
                <span className="font-medium">{formatearPrecio(editableQuantities.acreditadores * editableUnitPrices.acreditador)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Supervisores ({editableQuantities.supervisores} × {formatearPrecio(editableUnitPrices.supervisor)}):</span>
                <span className="font-medium">{formatearPrecio(editableQuantities.supervisores * editableUnitPrices.supervisor)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total Final</div>
              <div className="text-xl font-bold text-primary">
                {formatearPrecio(editableTotal)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
