
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ContactoEmpresasCard from './ContactoEmpresasCard';
import EventoCard from './EventoCard';
import PresupuestosCard from './PresupuestosCard';
import BusinessStatusCard from './BusinessStatusCard';
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Column - Main Info */}
      <div className="lg:col-span-3 space-y-6">
        {/* Event Details */}
        <EventoCard negocio={negocio} />
        
        {/* Budgets */}
        <PresupuestosCard
          negocio={negocio}
          onCrearPresupuesto={onCrearPresupuesto}
          onEditarPresupuesto={onEditarPresupuesto}
          onEliminarPresupuesto={onEliminarPresupuesto}
          onVerPDF={onVerPDF}
          onCambiarEstado={onCambiarEstado}
        />
      </div>
      
      {/* Right Column - Secondary Info */}
      <div className="space-y-6">
        {/* Business Summary */}
        <BusinessStatusCard negocio={negocio} />
        
        {/* Contact and Companies */}
        <ContactoEmpresasCard 
          contacto={negocio.contacto}
          productora={negocio.productora}
          clienteFinal={negocio.clienteFinal}
        />
        
        {/* Quick Actions */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm">Acciones Rápidas</h3>
          <div className="space-y-2">
            <Button 
              onClick={onCrearPresupuesto}
              className="w-full justify-start text-sm"
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Presupuesto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleNegocioMainContent;
