import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import { PriceCalculatorResult } from '@/types/priceCalculator.types';
import { formatearPrecio } from '@/utils/formatters';

interface CalculationResultsCardProps {
  result: PriceCalculatorResult;
}

export const CalculationResultsCard: React.FC<CalculationResultsCardProps> = ({ result }) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Resultado del Cálculo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Compact Results Layout */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-medium mb-1">Distribución</div>
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
            <div className="font-medium mb-1">Personal Requerido</div>
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

        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="text-xs">
              <div className="font-medium mb-1">Costos</div>
              <div className="space-y-1">
                <div>Acreditadores: {formatearPrecio(result.breakdown.acreditadores.total)}</div>
                <div>Supervisores: {formatearPrecio(result.breakdown.supervisores.total)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-xl font-bold text-primary">
                {formatearPrecio(result.totalPrice)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};