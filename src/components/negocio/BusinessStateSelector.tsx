import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { EstadoNegocio } from '@/types';
import { formatBusinessStateForDisplay, getBusinessStateColors } from '@/utils/businessCalculations';

interface BusinessStateSelectorProps {
  currentState: EstadoNegocio;
  onStateChange: (newState: EstadoNegocio) => void;
  isUpdating?: boolean;
}

const BusinessStateSelector: React.FC<BusinessStateSelectorProps> = ({
  currentState,
  onStateChange,
  isUpdating = false
}) => {
  const availableStates: EstadoNegocio[] = [
    'oportunidad_creada',
    'presupuesto_enviado',
    'parcialmente_aceptado',
    'negocio_aceptado',
    'negocio_cerrado',
    'negocio_perdido'
  ];

  const handleStateChange = (newState: EstadoNegocio) => {
    if (newState !== currentState && !isUpdating) {
      onStateChange(newState);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        <div className="cursor-pointer">
          <Badge 
            variant="outline"
            className={`${getBusinessStateColors(currentState)} flex items-center gap-1 hover:opacity-80 transition-opacity`}
          >
            {formatBusinessStateForDisplay(currentState)}
            <ChevronDown className="w-3 h-3" />
          </Badge>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {availableStates.map((state) => (
          <DropdownMenuItem
            key={state}
            onClick={() => handleStateChange(state)}
            disabled={state === currentState || isUpdating}
            className={`cursor-pointer ${state === currentState ? 'bg-slate-50' : ''}`}
          >
            <Badge 
              variant="outline"
              className={`${getBusinessStateColors(state)} mr-2 border-0`}
            >
              {formatBusinessStateForDisplay(state)}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BusinessStateSelector;