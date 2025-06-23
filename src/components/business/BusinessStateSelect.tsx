
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { obtenerEstadoNegocioInfo, formatBusinessStateForDisplay } from '@/utils/businessCalculations';
import { Negocio } from '@/types';

interface BusinessStateSelectProps {
  negocio: Negocio;
  onStateChange: (negocioId: string, nuevoEstado: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

const MAIN_BUSINESS_STATES = [
  'oportunidad_creada',
  'presupuesto_enviado',
  'parcialmente_aceptado',
  'negocio_aceptado',
  'negocio_cerrado',
  'negocio_perdido'
];

const BusinessStateSelect: React.FC<BusinessStateSelectProps> = ({
  negocio,
  onStateChange,
  disabled = false,
  size = 'default'
}) => {
  const { colorEstado } = obtenerEstadoNegocioInfo(negocio);

  const handleStateChange = (nuevoEstado: string) => {
    onStateChange(negocio.id, nuevoEstado);
  };

  return (
    <Select
      value={negocio.estado}
      onValueChange={handleStateChange}
      disabled={disabled}
    >
      <SelectTrigger className={size === 'sm' ? 'h-8 text-xs' : 'h-10'}>
        <SelectValue asChild>
          <Badge className={`${colorEstado} border`}>
            {formatBusinessStateForDisplay(negocio.estado)}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {MAIN_BUSINESS_STATES.map((estado) => {
          const { colorEstado: itemColor } = obtenerEstadoNegocioInfo({ ...negocio, estado });
          return (
            <SelectItem key={estado} value={estado}>
              <Badge className={`${itemColor} border`}>
                {formatBusinessStateForDisplay(estado)}
              </Badge>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default BusinessStateSelect;
