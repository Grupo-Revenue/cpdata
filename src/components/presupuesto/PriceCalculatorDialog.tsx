
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Users, Percent, UserCheck, Settings } from 'lucide-react';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { formatearPrecio } from '@/utils/formatters';

interface PriceCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPriceCalculated: (price: number) => void;
  initialAttendees?: number;
}

const PriceCalculatorDialog: React.FC<PriceCalculatorDialogProps> = ({
  open,
  onOpenChange,
  onPriceCalculated,
  initialAttendees = 0
}) => {
  const {
    inputs,
    result,
    prices,
    loading,
    updateInput,
    updateDistributionPercentage,
    updateAccreditationCapacity,
    calculatePrice,
    resetCalculator
  } = usePriceCalculator();

  React.useEffect(() => {
    if (open && initialAttendees > 0) {
      updateInput('attendees', initialAttendees);
    }
  }, [open, initialAttendees, updateInput]);

  const handleCalculate = () => {
    try {
      calculatePrice();
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleApplyPrice = () => {
    if (result) {
      onPriceCalculated(result.totalPrice);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    resetCalculator();
    onOpenChange(false);
  };

  // Auto-adjust percentages when one changes
  const handlePercentageChange = (type: 'manual' | 'expressQR', value: number) => {
    const otherType = type === 'manual' ? 'expressQR' : 'manual';
    const adjustedValue = Math.max(0, Math.min(100, value));
    const remainingValue = Math.max(0, 100 - adjustedValue);
    
    updateDistributionPercentage(type, adjustedValue);
    updateDistributionPercentage(otherType, remainingValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Calculadora de Precios - Personal de Acreditación
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Attendees */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Cantidad de Asistentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  value={inputs.attendees}
                  onChange={(e) => updateInput('attendees', parseInt(e.target.value) || 0)}
                  placeholder="Número de asistentes"
                  min="0"
                />
              </CardContent>
            </Card>

            {/* Distribution Percentages */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Percent className="w-4 h-4 mr-2" />
                  Distribución de Asistentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="manual-percent" className="text-xs">Manual (%)</Label>
                  <Input
                    id="manual-percent"
                    type="number"
                    value={inputs.distributionPercentages.manual}
                    onChange={(e) => handlePercentageChange('manual', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="express-percent" className="text-xs">Express QR (%)</Label>
                  <Input
                    id="express-percent"
                    type="number"
                    value={inputs.distributionPercentages.expressQR}
                    onChange={(e) => handlePercentageChange('expressQR', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  Total: {(inputs.distributionPercentages.manual + inputs.distributionPercentages.expressQR).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            {/* Accreditation Capacity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Capacidad de Acreditación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="manual-capacity" className="text-xs">Manual (asistentes por acreditador)</Label>
                  <Input
                    id="manual-capacity"
                    type="number"
                    value={inputs.accreditationCapacity.manual}
                    onChange={(e) => updateAccreditationCapacity('manual', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="express-capacity" className="text-xs">Express QR (asistentes por acreditador)</Label>
                  <Input
                    id="express-capacity"
                    type="number"
                    value={inputs.accreditationCapacity.expressQR}
                    onChange={(e) => updateAccreditationCapacity('expressQR', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Cantidad de asistentes que puede atender cada acreditador
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <Button 
                onClick={handleCalculate} 
                className="flex-1"
                disabled={loading || !prices}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Precio
              </Button>
              <Button variant="outline" onClick={resetCalculator}>
                Limpiar
              </Button>
            </div>

            {result && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Resultado del Cálculo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Distribution Summary */}
                  <div className="bg-blue-50 p-3 rounded text-sm space-y-1">
                    <p><strong>Distribución de Asistentes:</strong></p>
                    <p>Manual: {result.distributionSummary.manualAttendees} asistentes</p>
                    <p>Express QR: {result.distributionSummary.expressQRAttendees} asistentes</p>
                  </div>

                  {/* Staff Calculation */}
                  <div className="bg-green-50 p-3 rounded text-sm space-y-1">
                    <p><strong>Personal Requerido:</strong></p>
                    <p>Acreditadores Manual: {result.distributionSummary.manualAccreditors}</p>
                    <p>Acreditadores Express QR: {result.distributionSummary.expressQRAccreditors}</p>
                    <p>Total Acreditadores: {result.distributionSummary.totalAccreditors}</p>
                    <p>Supervisores: {result.distributionSummary.supervisors}</p>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>Acreditadores ({result.breakdown.acreditadores.quantity}x)</span>
                      <span>{formatearPrecio(result.breakdown.acreditadores.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Supervisores ({result.breakdown.supervisores.quantity}x)</span>
                      <span>{formatearPrecio(result.breakdown.supervisores.total)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Costo Total Personal</span>
                      <span className="text-green-600">{formatearPrecio(result.totalPrice)}</span>
                    </div>
                  </div>

                  <Button onClick={handleApplyPrice} className="w-full">
                    Aplicar Precio
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceCalculatorDialog;
