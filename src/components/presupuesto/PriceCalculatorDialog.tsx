
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Users, Percent, DollarSign } from 'lucide-react';
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
    updateInput,
    updateDistributionPercentage,
    updateAccreditationValue,
    calculatePrice,
    resetCalculator
  } = usePriceCalculator();

  React.useEffect(() => {
    if (open && initialAttendees > 0) {
      updateInput('attendees', initialAttendees);
    }
  }, [open, initialAttendees, updateInput]);

  const handleCalculate = () => {
    calculatePrice();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Calculadora de Precios - Acreditación
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

            {/* Distribution Percentages - Manual vs Express QR */}
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
                    onChange={(e) => updateDistributionPercentage('manual', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Requiere: Credencial + Cordón + Porta Credencial
                  </p>
                </div>
                <div>
                  <Label htmlFor="express-percent" className="text-xs">Express QR (%)</Label>
                  <Input
                    id="express-percent"
                    type="number"
                    value={inputs.distributionPercentages.expressQR}
                    onChange={(e) => updateDistributionPercentage('expressQR', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Requiere: Credencial + Cordón (sin Porta Credencial)
                  </p>
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  Total: {inputs.distributionPercentages.manual + inputs.distributionPercentages.expressQR}%
                </div>
              </CardContent>
            </Card>

            {/* Accreditation Values */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Valores de Acreditación (CLP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="credencial-value" className="text-xs">Valor Credencial</Label>
                  <Input
                    id="credencial-value"
                    type="number"
                    value={inputs.accreditationValues.credencial}
                    onChange={(e) => updateAccreditationValue('credencial', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <Label htmlFor="cordon-value" className="text-xs">Valor Cordón</Label>
                  <Input
                    id="cordon-value"
                    type="number"
                    value={inputs.accreditationValues.cordon}
                    onChange={(e) => updateAccreditationValue('cordon', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <Label htmlFor="porta-value" className="text-xs">Valor Porta Credencial</Label>
                  <Input
                    id="porta-value"
                    type="number"
                    value={inputs.accreditationValues.portaCredencial}
                    onChange={(e) => updateAccreditationValue('portaCredencial', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <Button onClick={handleCalculate} className="flex-1">
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
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p><strong>Distribución de Asistentes:</strong></p>
                    <p>Manual: {Math.ceil((inputs.attendees * inputs.distributionPercentages.manual) / 100)} asistentes</p>
                    <p>Express QR: {Math.ceil((inputs.attendees * inputs.distributionPercentages.expressQR) / 100)} asistentes</p>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>Credenciales ({result.breakdown.credencial.quantity}x)</span>
                      <span>{formatearPrecio(result.breakdown.credencial.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Cordones ({result.breakdown.cordon.quantity}x)</span>
                      <span>{formatearPrecio(result.breakdown.cordon.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Porta Credenciales ({result.breakdown.portaCredencial.quantity}x)</span>
                      <span>{formatearPrecio(result.breakdown.portaCredencial.total)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Precio Total</span>
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
