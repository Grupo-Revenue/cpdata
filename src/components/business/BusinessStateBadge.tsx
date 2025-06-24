
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Circle, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Archive,
  AlertCircle
} from 'lucide-react';
import { Negocio } from '@/types';

interface BusinessStateBadgeProps {
  estado: Negocio['estado'];
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

const getStateConfig = (estado: Negocio['estado']) => {
  const configs = {
    'oportunidad_creada': {
      label: 'Oportunidad',
      icon: Circle,
      className: 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100',
      iconColor: 'text-slate-500'
    },
    'presupuesto_enviado': {
      label: 'Presupuesto Enviado',
      icon: Send,
      className: 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100',
      iconColor: 'text-blue-500'
    },
    'parcialmente_aceptado': {
      label: 'Parcialmente Aceptado',
      icon: Clock,
      className: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100',
      iconColor: 'text-amber-500'
    },
    'negocio_aceptado': {
      label: 'Aceptado',
      icon: CheckCircle,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100',
      iconColor: 'text-emerald-500'
    },
    'negocio_cerrado': {
      label: 'Cerrado',
      icon: Archive,
      className: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100',
      iconColor: 'text-green-500'
    },
    'negocio_perdido': {
      label: 'Perdido',
      icon: XCircle,
      className: 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100',
      iconColor: 'text-red-500'
    }
  };

  return configs[estado] || {
    label: estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' '),
    icon: AlertCircle,
    className: 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100',
    iconColor: 'text-slate-500'
  };
};

const BusinessStateBadge: React.FC<BusinessStateBadgeProps> = ({
  estado,
  size = 'default',
  showIcon = true
}) => {
  const config = getStateConfig(estado);
  const Icon = config.icon;
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs h-6' 
    : 'px-3 py-1.5 text-sm h-7';
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <Badge 
      variant="outline"
      className={`${config.className} ${sizeClasses} font-medium transition-colors inline-flex items-center gap-1.5`}
    >
      {showIcon && <Icon className={`${iconSize} ${config.iconColor}`} />}
      <span>{config.label}</span>
    </Badge>
  );
};

export default BusinessStateBadge;
