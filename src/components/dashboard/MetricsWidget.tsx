
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, FileText, TrendingUp, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { useNegocio } from '@/context/NegocioContext';

const MetricsWidget: React.FC = () => {
  const { negocios } = useNegocio();

  // Calculate enhanced metrics with new states
  const negociosActivos = negocios.filter(n => 
    ['activo', 'revision_pendiente', 'en_negociacion'].includes(n.estado)
  ).length;
  
  const negociosGanados = negocios.filter(n => 
    ['ganado', 'parcialmente_ganado'].includes(n.estado)
  ).length;
  
  const negociosProspecto = negocios.filter(n => n.estado === 'prospecto').length;

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
      label: 'En Proceso',
      value: negociosActivos,
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      label: 'Ganados',
      value: negociosGanados,
      icon: CheckCircle,
      color: 'text-emerald-600'
    },
    {
      label: 'Prospectos',
      value: negociosProspecto,
      icon: Target,
      color: 'text-orange-600'
    }
  ];

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="grid grid-cols-5 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600">
                  {metric.label}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsWidget;
