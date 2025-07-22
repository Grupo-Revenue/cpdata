
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { Presupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';

interface PresupuestosResumenProps {
  presupuestos: Presupuesto[];
}

const PresupuestosResumen: React.FC<PresupuestosResumenProps> = ({ presupuestos }) => {
  const totalPresupuestos = presupuestos.length;
  const presupuestosAprobados = presupuestos.filter(p => p.estado === 'aprobado').length;
  const presupuestosPublicados = presupuestos.filter(p => p.estado === 'publicado').length;

  // Calculate value using the new logic
  const approvedTotal = presupuestos
    .filter(p => p.estado === 'aprobado')
    .reduce((sum, p) => sum + (p.total || 0), 0);
  
  const rejectedTotal = presupuestos
    .filter(p => p.estado === 'rechazado')
    .reduce((sum, p) => sum + (p.total || 0), 0);

  const sentTotal = presupuestos
    .filter(p => p.estado === 'publicado')
    .reduce((sum, p) => sum + (p.total || 0), 0);

  // Apply the same logic as businessValueCalculator
  let valorTotal = 0;
  if (approvedTotal > 0) {
    valorTotal = Math.max(0, approvedTotal - rejectedTotal);
  } else if (sentTotal > 0) {
    valorTotal = sentTotal;
  } else {
    valorTotal = rejectedTotal;
  }

  const stats = [
    {
      label: 'Total Presupuestos',
      value: totalPresupuestos.toString(),
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      label: approvedTotal > 0 && rejectedTotal > 0 ? 'Valor Neto' : 'Valor Total',
      value: formatearPrecio(valorTotal),
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      label: 'Aprobados',
      value: presupuestosAprobados.toString(),
      icon: TrendingUp,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      label: 'En Proceso',
      value: presupuestosPublicados.toString(),
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className={`${stat.bgColor} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${stat.color} rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PresupuestosResumen;
