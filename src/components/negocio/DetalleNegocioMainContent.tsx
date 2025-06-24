
import React from 'react';
import BusinessSummaryHeader from './BusinessSummaryHeader';
import PresupuestosTable from './presupuestos/PresupuestosTable';
import { Negocio } from '@/types';

interface DetalleNegocioMainContentProps {
  negocio: Negocio;
  onCrearPresupuesto: () => void;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => Promise<void>;
  onVerPDF: (presupuestoId: string) => void;
  onCambiarEstado: (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => Promise<void>;
  onCambiarEstadoNegocio?: (negocioId: string, nuevoEstado: string) => void;
}

const DetalleNegocioMainContent: React.FC<DetalleNegocioMainContentProps> = ({
  negocio,
  onCrearPresupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onCambiarEstado,
  onCambiarEstadoNegocio
}) => {
  return (
    <div className="space-y-6">
      {/* Business Summary Header */}
      <BusinessSummaryHeader
        negocio={negocio}
        onCambiarEstado={onCambiarEstadoNegocio}
      />
      
      {/* Budgets Table - Main Focus */}
      <PresupuestosTable
        negocio={negocio}
        onCrearPresupuesto={onCrearPresupuesto}
        onEditarPresupuesto={onEditarPresupuesto}
        onEliminarPresupuesto={onEliminarPresupuesto}
        onVerPDF={onVerPDF}
        onCambiarEstado={onCambiarEstado}
      />
    </div>
  );
};

export default DetalleNegocioMainContent;
