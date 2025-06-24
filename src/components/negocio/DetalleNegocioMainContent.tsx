
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BusinessInfoCard from './BusinessInfoCard';
import PresupuestosCard from './PresupuestosCard';
import CompactMetricsCard from './CompactMetricsCard';
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Left Column - Main Content */}
      <div className="lg:col-span-3 space-y-4">
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
      
      {/* Right Column - Metrics and Quick Actions */}
      <div className="space-y-4">
        {/* Compact Metrics */}
        <CompactMetricsCard negocio={negocio} />
        
        {/* Quick Actions */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <h3 className="font-medium text-slate-900 mb-3 text-sm">Acciones</h3>
          <div className="space-y-2">
            <Button 
              onClick={onCrearPresupuesto}
              className="w-full justify-start text-sm h-8"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleNegocioMainContent;
