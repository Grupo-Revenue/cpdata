
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EstadoNegocio } from '@/types';
import { Clock, CheckCircle, AlertCircle, XCircle, Target, TrendingUp } from 'lucide-react';

interface BusinessStateBadgeProps {
  estado: EstadoNegocio;
  className?: string;
  showIcon?: boolean;
}

const getEstadoInfo = (estado: EstadoNegocio) => {
  switch (estado) {
    case 'oportunidad_creada':
      return {
        text: 'Oportunidad Creada',
        variant: 'outline' as const,
        className: 'bg-gray-50 text-gray-700 border-gray-300',
        icon: Target
      };
    case 'presupuesto_enviado':
      return {
        text: 'Presupuesto Enviado',
        variant: 'secondary' as const,
        className: 'bg-blue-50 text-blue-700 border-blue-300',
        icon: Clock
      };
    case 'negocio_aceptado':
      return {
        text: 'Negocio Aceptado',
        variant: 'default' as const,
        className: 'bg-green-50 text-green-700 border-green-300',
        icon: CheckCircle
      };
    case 'parcialmente_aceptado':
      return {
        text: 'Parcialmente Aceptado',
        variant: 'secondary' as const,
        className: 'bg-yellow-50 text-yellow-700 border-yellow-300',
        icon: TrendingUp
      };
    case 'negocio_perdido':
      return {
        text: 'Negocio Perdido',
        variant: 'destructive' as const,
        className: 'bg-red-50 text-red-700 border-red-300',
        icon: XCircle
      };
    case 'negocio_cerrado':
      return {
        text: 'Negocio Cerrado',
        variant: 'default' as const,
        className: 'bg-purple-50 text-purple-700 border-purple-300',
        icon: CheckCircle
      };
    default:
      return {
        text: estado,
        variant: 'outline' as const,
        className: 'bg-gray-50 text-gray-700 border-gray-300',
        icon: AlertCircle
      };
  }
};

const BusinessStateBadge: React.FC<BusinessStateBadgeProps> = ({ 
  estado, 
  className = '', 
  showIcon = false 
}) => {
  const { text, className: badgeClassName, icon: Icon } = getEstadoInfo(estado);

  return (
    <Badge className={`${badgeClassName} ${className} flex items-center gap-1`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {text}
    </Badge>
  );
};

export default BusinessStateBadge;
