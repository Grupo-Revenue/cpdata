
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Negocio } from '@/types';

interface BusinessInfoPanelProps {
  negocio: Negocio;
  businessValue: number;
}

const BusinessInfoPanel: React.FC<BusinessInfoPanelProps> = ({ negocio, businessValue }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-white rounded-lg border">
      <div>
        <div className="text-sm font-medium text-gray-700">Estado Actual</div>
        <Badge variant="outline" className="mt-1">
          {negocio.estado}
        </Badge>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-700">Valor Calculado</div>
        <div className="text-lg font-bold text-green-600">
          ${businessValue.toLocaleString()}
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-700">Presupuestos</div>
        <div className="text-sm text-gray-600">
          {negocio.presupuestos?.length || 0} total
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoPanel;
