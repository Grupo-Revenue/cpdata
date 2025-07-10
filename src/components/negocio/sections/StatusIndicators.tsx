
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusIndicatorsProps {
  presupuestosAprobados: number;
  presupuestosPublicados: number;
  presupuestosBorrador: number;
  presupuestosRechazados: number;
  presupuestosVencidos: number;
  totalPresupuestos: number;
}

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  presupuestosAprobados,
  presupuestosPublicados,
  presupuestosBorrador,
  presupuestosRechazados,
  presupuestosVencidos,
  totalPresupuestos
}) => {
  if (totalPresupuestos === 0) return null;

  const badges = [];
  
  if (presupuestosAprobados > 0) {
    badges.push(
      <Badge key="aprobados" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
        {presupuestosAprobados} aprobado{presupuestosAprobados !== 1 ? 's' : ''}
      </Badge>
    );
  }
  
  if (presupuestosPublicados > 0) {
    badges.push(
      <Badge key="publicados" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
        {presupuestosPublicados} publicado{presupuestosPublicados !== 1 ? 's' : ''}
      </Badge>
    );
  }
  
  if (presupuestosBorrador > 0) {
    badges.push(
      <Badge key="borrador" className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
        {presupuestosBorrador} borrador{presupuestosBorrador !== 1 ? 'es' : ''}
      </Badge>
    );
  }
  
  if (presupuestosRechazados > 0) {
    badges.push(
      <Badge key="rechazados" className="bg-red-100 text-red-700 border-red-200 text-xs">
        {presupuestosRechazados} rechazado{presupuestosRechazados !== 1 ? 's' : ''}
      </Badge>
    );
  }
  
  if (presupuestosVencidos > 0) {
    badges.push(
      <Badge key="vencidos" className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
        {presupuestosVencidos} vencido{presupuestosVencidos !== 1 ? 's' : ''}
      </Badge>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {badges}
    </div>
  );
};

export default StatusIndicators;
