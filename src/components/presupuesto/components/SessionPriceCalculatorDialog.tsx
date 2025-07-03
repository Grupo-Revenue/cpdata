import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { formatearPrecio } from '@/utils/formatters';

interface SessionPriceCalculatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCalculation: (result: {
    precio: number;
    acreditadores: number;
    supervisor: number;
  }) => void;
}

const SessionPriceCalculatorDialog: React.FC<SessionPriceCalculatorDialogProps> = ({
  isOpen,
  onClose,
  onApplyCalculation
}) => {
  const {
    inputs,
    result,
    updateInput,
    updateDistributionPercentage,
    updateAccreditationCapacity,
    calculatePrice,
    loading
  } = usePriceCalculator();

  const handleCalculate = () => {
    try {
      const calculationResult = calculatePrice();
      onApplyCalculation({
        precio: calculationResult.totalPrice,
        acreditadores: calculationResult.distributionSummary.totalAccreditors,
        supervisor: calculationResult.distributionSummary.supervisors
      });
      onClose();
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Acreditación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="attendees">Cantidad de Asistentes</Label>
              <Input
                id="attendees"
                type="number"
                min="0"
                value={inputs.attendees}
                onChange={(e) => updateInput('attendees', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label>Distribución de Acreditación (%)</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="manual-percentage" className="text-sm">Manual</Label>
                <Input
                  id="manual-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={inputs.distributionPercentages.manual}
                  onChange={(e) => updateDistributionPercentage('manual', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="express-percentage" className="text-sm">Express QR</Label>
                <Input
                  id="express-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={inputs.distributionPercentages.expressQR}
                  onChange={(e) => updateDistributionPercentage('expressQR', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Capacidad de Acreditación (asistentes por acreditador)</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="manual-capacity" className="text-sm">Manual</Label>
                <Input
                  id="manual-capacity"
                  type="number"
                  min="1"
                  value={inputs.accreditationCapacity.manual}
                  onChange={(e) => updateAccreditationCapacity('manual', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="express-capacity" className="text-sm">Express QR</Label>
                <Input
                  id="express-capacity"
                  type="number"
                  min="1"
                  value={inputs.accreditationCapacity.expressQR}
                  onChange={(e) => updateAccreditationCapacity('expressQR', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {result && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-3">Resultado del Cálculo</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Acreditadores:</span>
                  <span className="ml-2 font-medium">{result.distributionSummary.totalAccreditors}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Supervisores:</span>
                  <span className="ml-2 font-medium">{result.distributionSummary.supervisors}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Precio Total:</span>
                  <span className="ml-2 font-bold text-lg">{formatearPrecio(result.totalPrice)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCalculate} disabled={loading || !result}>
            Aplicar Cálculo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionPriceCalculatorDialog;