
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileText, RefreshCw, DollarSign } from 'lucide-react';
import { Negocio } from '@/types';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import { formatearPrecio } from '@/utils/formatters';
import BusinessSyncStatus from '@/components/business/BusinessSyncStatus';

interface CompactMetricsCardProps {
  negocio: Negocio;
}

const CompactMetricsCard: React.FC<CompactMetricsCardProps> = ({ negocio }) => {
  const valorTotal = calcularValorNegocio(negocio);
  const presupuestosAprobados = negocio.presupuestos.filter(p => p.estado === 'aprobado').length;
  const presupuestosEnviados = negocio.presupuestos.filter(p => p.estado === 'enviado').length;

  const stats = [
    {
      icon: TrendingUp,
      label: 'Valor Total',
      value: formatearPrecio(valorTotal),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: FileText,
      label: 'Presupuestos',
      value: negocio.presupuestos.length.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Resumen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Metrics */}
        <div className="space-y-2">
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.bgColor} rounded-lg p-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <stat.icon className={`w-4 h-4 ${stat.color} mr-2`} />
                  <span className="text-xs font-medium text-slate-700">{stat.label}</span>
                </div>
                <div className={`text-sm font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Status */}
        {(presupuestosAprobados > 0 || presupuestosEnviados > 0) && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-700 mb-2">Estado Presupuestos</div>
            <div className="space-y-1 text-xs">
              {presupuestosAprobados > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-700">Aprobados</span>
                  <span className="font-medium text-green-700">{presupuestosAprobados}</span>
                </div>
              )}
              {presupuestosEnviados > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Enviados</span>
                  <span className="font-medium text-blue-700">{presupuestosEnviados}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HubSpot Sync Status */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-xs font-medium text-blue-800">HubSpot</span>
            </div>
          </div>
          <BusinessSyncStatus negocio={negocio} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactMetricsCard;
