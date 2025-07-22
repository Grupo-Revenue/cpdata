
import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { formatearPrecio } from '@/utils/formatters';

interface BusinessValueSectionProps {
  valorNegocio: number;
  presupuestos?: Array<{
    estado: string;
    total: number;
  }>;
}

const BusinessValueSection: React.FC<BusinessValueSectionProps> = ({ valorNegocio, presupuestos = [] }) => {
  // Calculate breakdown for display
  const approvedTotal = presupuestos
    .filter(p => p.estado === 'aprobado')
    .reduce((sum, p) => sum + (p.total || 0), 0);
  
  const rejectedTotal = presupuestos
    .filter(p => p.estado === 'rechazado')
    .reduce((sum, p) => sum + (p.total || 0), 0);

  const sentTotal = presupuestos
    .filter(p => p.estado === 'publicado')
    .reduce((sum, p) => sum + (p.total || 0), 0);

  const hasApprovedBudgets = approvedTotal > 0;
  const hasRejectedBudgets = rejectedTotal > 0;
  const hasSentBudgets = sentTotal > 0;

  // Determine the label based on what's being shown
  let valueLabel = 'Valor Total';
  if (hasApprovedBudgets) {
    valueLabel = hasRejectedBudgets ? 'Valor Aprobado' : 'Valor Total';
  } else if (hasSentBudgets) {
    valueLabel = 'Valor Enviado';
  } else if (hasRejectedBudgets) {
    valueLabel = 'Valor Rechazado';
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-slate-100 rounded-lg">
        <DollarSign className="w-5 h-5 text-slate-700" />
      </div>
      <div>
        <p className="text-xs text-slate-600 font-medium">
          {valueLabel}
        </p>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-slate-900">
            {formatearPrecio(valorNegocio)}
          </span>
          {valorNegocio > 0 && (
            <div className="flex items-center space-x-1 text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-medium">Activo</span>
            </div>
          )}
        </div>
        {hasApprovedBudgets && hasRejectedBudgets && (
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-600">Aprobado: {formatearPrecio(approvedTotal)}</span>
            {' | '}
            <span className="text-red-500">Rechazado: {formatearPrecio(rejectedTotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessValueSection;
