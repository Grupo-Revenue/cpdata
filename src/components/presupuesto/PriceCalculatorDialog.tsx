
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Users, Percent, DollarSign, RefreshCw } from 'lucide-react';
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
    calculatePrice,
    resetCalculator,
    refetchPrices
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
                    onChange={(e) => handlePercentageChange('expressQR', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Requiere: Credencial + Cordón (sin Porta Credencial)
                  </p>
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  Total: {(inputs.distributionPercentages.manual + inputs.distributionPercentages.expressQR).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            {/* Current Prices Display */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Precios Actuales (CLP)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refetchPrices}
                    disabled={loading}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <p className="text-sm text-gray-500">Cargando precios...</p>
                ) : prices ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Credencial:</span>
                      <span>{formatearPrecio(prices.credencial)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cordón:</span>
                      <span>{formatearPrecio(prices.cordon)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Porta Credencial:</span>
                      <span>{formatearPrecio(prices.portaCredencial)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-red-500">Error cargando precios</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Los precios se obtienen automáticamente de la base de datos
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
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p><strong>Distribución de Asistentes:</strong></p>
                    <p>Manual: {result.distributionSummary.manualAttendees} asistentes</p>
                    <p>Express QR: {result.distributionSummary.expressQRAttendees} asistentes</p>
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
