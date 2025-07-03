import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Calculadora de Acreditación
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-2">
          <div className="space-y-4">
            {/* Combined Event Info and Distribution */}
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
                    onChange={(e) => updateInput('attendees', parseInt(e.target.value) || 0)}
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
                        onChange={(e) => handleDistributionChange('manual', parseInt(e.target.value) || 0)}
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
                        onChange={(e) => handleDistributionChange('expressQR', parseInt(e.target.value) || 0)}
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
                        onChange={(e) => updateAccreditationCapacity('manual', parseInt(e.target.value) || 1)}
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
                        onChange={(e) => updateAccreditationCapacity('expressQR', parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
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
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancelar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCalculateManual} 
            disabled={loading}
            size="sm"
          >
            <Calculator className="h-3 w-3 mr-1" />
            Calcular
          </Button>
          <Button onClick={handleApplyCalculation} disabled={loading || !result} size="sm">
            Aplicar Cálculo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionPriceCalculatorDialog;