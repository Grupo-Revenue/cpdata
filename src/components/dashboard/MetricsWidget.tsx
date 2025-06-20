
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, FileText, TrendingUp } from 'lucide-react';
import { useNegocio } from '@/context/NegocioContext';

const MetricsWidget: React.FC = () => {
  const { negocios } = useNegocio();

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
      label: 'Activos',
      value: negocios.filter(n => n.estado === 'activo').length,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-6">
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
