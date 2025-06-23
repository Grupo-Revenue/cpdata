
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileText } from 'lucide-react';
import { Negocio } from '@/types';
import { calcularValorNegocio } from '@/utils/businessCalculations';

interface BusinessStatusCardProps {
  negocio: Negocio;
}

const BusinessStatusCard: React.FC<BusinessStatusCardProps> = ({ negocio }) => {
  const valorTotal = calcularValorNegocio(negocio);

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-900">Resumen del Negocio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Valor Total</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {formatearPrecio(valorTotal)}
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <FileText className="w-5 h-5 text-slate-600 mr-2" />
            <span className="text-sm font-medium text-slate-700">Presupuestos</span>
          </div>
          <div className="text-lg font-semibold text-slate-900">
            {negocio.presupuestos.length} presupuesto{negocio.presupuestos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessStatusCard;
