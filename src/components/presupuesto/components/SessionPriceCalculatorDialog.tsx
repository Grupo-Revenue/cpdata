import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator } from 'lucide-react';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { EventConfigurationSection } from './session-calculator/EventConfigurationSection';
import { CalculationResultsCard } from './session-calculator/CalculationResultsCard';
import { DialogActions } from './session-calculator/DialogActions';
import { DEFAULT_PRICES } from '@/constants/priceCalculator.constants';

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
    prices,
    updateInput,
    updateDistributionPercentage,
    updateAccreditationCapacity,
    calculatePrice,
    loading
  } = usePriceCalculator();

  // Flag para controlar la primera sincronización
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Estados editables para precios unitarios y cantidades
  const [editableUnitPrices, setEditableUnitPrices] = useState({
    acreditador: DEFAULT_PRICES.acreditador,
    supervisor: DEFAULT_PRICES.supervisor
  });

  const [editableQuantities, setEditableQuantities] = useState({
    acreditadores: 0,
    supervisores: 0
  });

  // Resetear el flag cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      setIsFirstLoad(true);
    }
  }, [isOpen]);

  // Sincronizar precios SOLO en la primera carga
  useEffect(() => {
    if (prices && isFirstLoad) {
      setEditableUnitPrices({
        acreditador: prices.acreditador,
        supervisor: prices.supervisor
      });
    }
  }, [prices, isFirstLoad]);

  // Sincronizar cantidades SOLO en la primera carga cuando hay resultado
  useEffect(() => {
    if (result && isFirstLoad) {
      setEditableQuantities({
        acreditadores: result.distributionSummary.totalAccreditors,
        supervisores: result.distributionSummary.supervisors
      });
      setIsFirstLoad(false);
    }
  }, [result, isFirstLoad]);

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

  // Calcular precio total basado en valores editables
  const calculateEditableTotal = () => {
    return (editableQuantities.acreditadores * editableUnitPrices.acreditador) + 
           (editableQuantities.supervisores * editableUnitPrices.supervisor);
  };

  const handleApplyCalculation = () => {
    const finalPrice = calculateEditableTotal();
    
    onApplyCalculation({
      precio: finalPrice,
      acreditadores: editableQuantities.acreditadores,
      supervisor: editableQuantities.supervisores
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

  // Verificar si hay resultado válido o valores editables para mostrar
  const hasValidResult = result || (editableQuantities.acreditadores > 0 || editableQuantities.supervisores > 0);

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
            <EventConfigurationSection
              inputs={inputs}
              onUpdateInput={updateInput}
              onDistributionChange={handleDistributionChange}
              onCapacityChange={updateAccreditationCapacity}
            />

            {result && (
              <CalculationResultsCard 
                result={result}
                editableUnitPrices={editableUnitPrices}
                editableQuantities={editableQuantities}
                onUnitPriceChange={setEditableUnitPrices}
                onQuantityChange={setEditableQuantities}
                editableTotal={calculateEditableTotal()}
              />
            )}
          </div>
        </ScrollArea>

        <DialogActions
          loading={loading}
          result={hasValidResult ? result : null}
          onClose={onClose}
          onCalculate={handleCalculateManual}
          onApplyCalculation={handleApplyCalculation}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SessionPriceCalculatorDialog;
