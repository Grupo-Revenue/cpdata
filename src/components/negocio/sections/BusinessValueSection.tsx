
import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { formatearPrecio } from '@/utils/formatters';

interface BusinessValueSectionProps {
  valorNegocio: number;
}

const BusinessValueSection: React.FC<BusinessValueSectionProps> = ({ valorNegocio }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-slate-100 rounded-lg">
        <DollarSign className="w-5 h-5 text-slate-700" />
      </div>
      <div>
        <p className="text-xs text-slate-600 font-medium">Valor Total</p>
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
      </div>
    </div>
  );
};

export default BusinessValueSection;
