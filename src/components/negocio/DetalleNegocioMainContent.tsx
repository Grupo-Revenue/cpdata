
import React from 'react';
import BusinessInfoCard from './BusinessInfoCard';
import PresupuestosCard from './PresupuestosCard';
import { Negocio } from '@/types';

interface DetalleNegocioMainContentProps {
  negocio: Negocio;
  onCrearPresupuesto: () => void;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => Promise<void>;
  onVerPDF: (presupuestoId: string) => void;
  onCambiarEstado: (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => Promise<void>;
}

const DetalleNegocioMainContent: React.FC<DetalleNegocioMainContentProps> = ({
  negocio,
  onCrearPresupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onCambiarEstado
}) => {
  return (
    <div className="space-y-6">
      {/* Budgets - Main Focus */}
      <PresupuestosCard
        negocio={negocio}
        onCrearPresupuesto={onCrearPresupuesto}
        onEditarPresupuesto={onEditarPresupuesto}
        onEliminarPresupuesto={onEliminarPresupuesto}
        onVerPDF={onVerPDF}
        onCambiarEstado={onCambiarEstado}
      />
      
      {/* Business Info - Secondary */}
      <BusinessInfoCard negocio={negocio} />
    </div>
  );
};

export default DetalleNegocioMainContent;
