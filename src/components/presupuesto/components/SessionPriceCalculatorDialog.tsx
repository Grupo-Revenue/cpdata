import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator } from 'lucide-react';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { EventConfigurationSection } from './session-calculator/EventConfigurationSection';
import { PricingConfigurationSection } from './session-calculator/PricingConfigurationSection';
import { CalculationResultsCard } from './session-calculator/CalculationResultsCard';
import { DialogActions } from './session-calculator/DialogActions';

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
    updateCustomPrice,
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
            <EventConfigurationSection
              inputs={inputs}
              onUpdateInput={updateInput}
              onDistributionChange={handleDistributionChange}
              onCapacityChange={updateAccreditationCapacity}
            />

            <PricingConfigurationSection
              inputs={inputs}
              prices={prices}
              onCustomPriceChange={updateCustomPrice}
            />

            {result && (
              <CalculationResultsCard result={result} />
            )}
          </div>
        </ScrollArea>

        <DialogActions
          loading={loading}
          result={result}
          onClose={onClose}
          onCalculate={handleCalculateManual}
          onApplyCalculation={handleApplyCalculation}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SessionPriceCalculatorDialog;