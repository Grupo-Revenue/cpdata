
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, FileText, TrendingUp, Target, CheckCircle, Clock } from 'lucide-react';
import { useNegocio } from '@/context/NegocioContext';
import { calcularValorNegocio, mapLegacyBusinessState } from '@/utils/businessCalculations';
import { formatearPrecio } from '@/utils/formatters';

const MetricsWidget: React.FC = () => {
  const { negocios } = useNegocio();

  // Calculate enhanced metrics with new business states
  const negociosConEstadoNormalizado = negocios.map(negocio => ({
    ...negocio,
    estadoNormalizado: mapLegacyBusinessState(negocio.estado)
  }));

  const oportunidades = negociosConEstadoNormalizado.filter(n => n.estadoNormalizado === 'oportunidad_creada').length;
  const presupuestosEnviados = negociosConEstadoNormalizado.filter(n => n.estadoNormalizado === 'presupuesto_enviado').length;
  const negociosAceptados = negociosConEstadoNormalizado.filter(n => 
    ['negocio_aceptado', 'parcialmente_aceptado'].includes(n.estadoNormalizado)
  ).length;
  const negociosCerrados = negociosConEstadoNormalizado.filter(n => n.estadoNormalizado === 'negocio_cerrado').length;

  // Calculate total value of all businesses
  const valorTotal = negocios.reduce((total, negocio) => total + calcularValorNegocio(negocio), 0);

  const metrics = [
    {
      label: 'Total Negocios',
      value: negocios.length,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      label: 'Presupuestos',
      value: negocios.reduce((total, n) => total + n.presupuestos.length, 0),
      icon: FileText,
      color: 'text-green-600'
    },
    {
      label: 'Oportunidades',
      value: oportunidades,
      icon: Target,
      color: 'text-slate-600'
    },
    {
      label: 'En Proceso',
      value: presupuestosEnviados,
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      label: 'Aceptados',
      value: negociosAceptados,
      icon: CheckCircle,
      color: 'text-emerald-600'
    },
    {
      label: 'Cerrados',
      value: negociosCerrados,
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900">
                    {metric.value}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {metric.label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Valor total en una card separada más ancha */}
      <Card className="md:col-span-3 lg:col-span-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-gray-900">
                {valorTotal > 0 ? formatearPrecio(valorTotal) : '$0'}
              </div>
              <div className="text-xs text-gray-600 truncate">
                Valor Total de Cartera
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsWidget;
