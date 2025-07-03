import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Users, UserCheck } from 'lucide-react';
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

  // Auto-calculate when inputs change
  useEffect(() => {
    if (inputs.attendees > 0) {
      try {
        calculatePrice();
      } catch (error) {
        console.error('Error auto-calculating price:', error);
      }
    }
  }, [inputs, calculatePrice]);

  // Calculate when dialog opens
  useEffect(() => {
    if (isOpen && inputs.attendees > 0) {
      try {
        calculatePrice();
      } catch (error) {
        console.error('Error calculating on open:', error);
      }
    }
  }, [isOpen, calculatePrice, inputs.attendees]);

  const handleCalculateManual = () => {
    try {
      calculatePrice();
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleApplyCalculation = () => {
    if (!result) return;
    
    onApplyCalculation({
      precio: result.totalPrice,
      acreditadores: result.distributionSummary.totalAccreditors,
      supervisor: result.distributionSummary.supervisors
    });
    onClose();
  };

  // Auto-adjust percentages to sum 100%
  const handleDistributionChange = (type: 'manual' | 'expressQR', value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    updateDistributionPercentage(type, clampedValue);
    
    // Auto-adjust the other percentage
    if (clampedValue <= 100) {
      const otherType = type === 'manual' ? 'expressQR' : 'manual';
      const otherValue = Math.max(0, 100 - clampedValue);
      updateDistributionPercentage(otherType, otherValue);
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Información del Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attendees">Cantidad de Asistentes</Label>
                  <Input
                    id="attendees"
                    type="number"
                    min="0"
                    value={inputs.attendees}
                    onChange={(e) => updateInput('attendees', parseInt(e.target.value) || 0)}
                    placeholder="Ingrese el número de asistentes"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Distribución de Acreditación (%)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Los porcentajes se ajustan automáticamente para sumar 100%
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-percentage" className="text-sm">Manual</Label>
                  <Input
                    id="manual-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={inputs.distributionPercentages.manual}
                    onChange={(e) => handleDistributionChange('manual', parseInt(e.target.value) || 0)}
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
                    onChange={(e) => handleDistributionChange('expressQR', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Capacidad de Acreditación</CardTitle>
              <p className="text-sm text-muted-foreground">
                Asistentes que puede atender cada acreditador
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          {result && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Resultado del Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">Distribución de Asistentes</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Manual:</span>
                        <span className="font-medium">{result.distributionSummary.manualAttendees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Express QR:</span>
                        <span className="font-medium">{result.distributionSummary.expressQRAttendees}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">Personal Requerido</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acreditadores Manual:</span>
                        <span className="font-medium">{result.distributionSummary.manualAccreditors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acreditadores Express:</span>
                        <span className="font-medium">{result.distributionSummary.expressQRAccreditors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Acreditadores:</span>
                        <span className="font-medium">{result.distributionSummary.totalAccreditors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supervisores:</span>
                        <span className="font-medium">{result.distributionSummary.supervisors}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-sm">
                      <h5 className="font-medium">Desglose de Costos</h5>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acreditadores:</span>
                        <span className="font-medium">{formatearPrecio(result.breakdown.acreditadores.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supervisores:</span>
                        <span className="font-medium">{formatearPrecio(result.breakdown.supervisores.total)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center md:justify-end">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Precio Total</div>
                        <div className="text-2xl font-bold text-primary">
                          {formatearPrecio(result.totalPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCalculateManual} 
            disabled={loading}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Precio
          </Button>
          <Button onClick={handleApplyCalculation} disabled={loading || !result}>
            Aplicar Cálculo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionPriceCalculatorDialog;