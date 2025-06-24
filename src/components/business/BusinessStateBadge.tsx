
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EstadoNegocio } from '@/types';

interface BusinessStateBadgeProps {
  estado: EstadoNegocio;
  className?: string;
}

const getEstadoInfo = (estado: EstadoNegocio) => {
  switch (estado) {
    case 'oportunidad_creada':
      return {
        text: 'Oportunidad Creada',
        variant: 'outline' as const,
        className: 'bg-gray-50 text-gray-700 border-gray-300'
      };
    case 'presupuesto_enviado':
      return {
        text: 'Presupuesto Enviado',
        variant: 'secondary' as const,
        className: 'bg-blue-50 text-blue-700 border-blue-300'
      };
    case 'negocio_aceptado':
      return {
        text: 'Negocio Aceptado',
        variant: 'default' as const,
        className: 'bg-green-50 text-green-700 border-green-300'
      };
    case 'parcialmente_aceptado':
      return {
        text: 'Parcialmente Aceptado',
        variant: 'secondary' as const,
        className: 'bg-yellow-50 text-yellow-700 border-yellow-300'
      };
    case 'negocio_perdido':
      return {
        text: 'Negocio Perdido',
        variant: 'destructive' as const,
        className: 'bg-red-50 text-red-700 border-red-300'
      };
    case 'negocio_cerrado':
      return {
        text: 'Negocio Cerrado',
        variant: 'default' as const,
        className: 'bg-purple-50 text-purple-700 border-purple-300'
      };
    default:
      return {
        text: estado,
        variant: 'outline' as const,
        className: 'bg-gray-50 text-gray-700 border-gray-300'
      };
  }
};

const BusinessStateBadge: React.FC<BusinessStateBadgeProps> = ({ estado, className = '' }) => {
  const { text, className: badgeClassName } = getEstadoInfo(estado);

  return (
    <Badge className={`${badgeClassName} ${className}`}>
      {text}
    </Badge>
  );
};

export default BusinessStateBadge;
