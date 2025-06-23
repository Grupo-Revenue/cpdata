
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Contact and Companies */}
        <ContactoEmpresasCard negocio={negocio} />
        
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
      
      {/* Right Column - Status and Actions */}
      <div className="space-y-6">
        {/* Business Status */}
        <BusinessStatusCard negocio={negocio} />
        
        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Acciones Rápidas</h3>
          <div className="space-y-2">
            <Button 
              onClick={onCrearPresupuesto}
              className="w-full justify-start"
              variant="outline"
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
