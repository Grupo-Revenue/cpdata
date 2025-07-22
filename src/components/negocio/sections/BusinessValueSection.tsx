
import React from 'react';
import { DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    valueLabel = 'Valor Aprobado';
  } else if (hasSentBudgets) {
    valueLabel = 'Valor Enviado';
  } else if (hasRejectedBudgets) {
    valueLabel = 'Valor Rechazado';
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0 p-3 bg-white rounded-xl shadow-sm border">
          <DollarSign className="w-6 h-6 text-slate-700" />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Value Label */}
          <p className="text-sm font-medium text-slate-600 mb-2">
            {valueLabel}
          </p>
          
          {/* Main Value */}
          <div className="flex items-baseline space-x-3 mb-3">
            <span className="text-3xl font-bold text-slate-900">
              {formatearPrecio(valorNegocio)}
            </span>
            {valorNegocio > 0 && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Activo
              </Badge>
            )}
          </div>
          
          {/* Breakdown */}
          {(hasApprovedBudgets || hasRejectedBudgets) && (
            <div className="flex flex-wrap gap-2">
              {hasApprovedBudgets && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Aprobado: {formatearPrecio(approvedTotal)}
                </Badge>
              )}
              {hasRejectedBudgets && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                  <XCircle className="w-3 h-3 mr-1" />
                  Rechazado: {formatearPrecio(rejectedTotal)}
                </Badge>
              )}
            </div>
          )}
          
          {/* Info text for clarity */}
          {hasApprovedBudgets && hasRejectedBudgets && (
            <p className="text-xs text-slate-500 mt-2">
              El valor mostrado corresponde únicamente a presupuestos aprobados
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessValueSection;
