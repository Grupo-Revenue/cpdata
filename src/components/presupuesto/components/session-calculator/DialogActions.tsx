import React from 'react';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { PriceCalculatorResult } from '@/types/priceCalculator.types';

interface DialogActionsProps {
  loading: boolean;
  result: PriceCalculatorResult | null;
  onClose: () => void;
  onCalculate: () => void;
  onApplyCalculation: () => void;
}

export const DialogActions: React.FC<DialogActionsProps> = ({
  loading,
  result,
  onClose,
  onCalculate,
  onApplyCalculation
}) => {
  return (
    <div className="flex justify-end gap-2 pt-3 border-t">
      <Button variant="outline" onClick={onClose} size="sm">
        Cancelar
      </Button>
      <Button 
        variant="outline" 
        onClick={onCalculate} 
        disabled={loading}
        size="sm"
      >
        <Calculator className="h-3 w-3 mr-1" />
        Calcular
      </Button>
      <Button onClick={onApplyCalculation} disabled={loading || !result} size="sm">
        Aplicar Cálculo
      </Button>
    </div>
  );
};