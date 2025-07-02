
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  onCrearNegocio: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onCrearNegocio }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
      <div className="space-y-2 animate-fade-in-up">
        <h1 className="text-3xl font-bold tracking-tight">
          Sistema de Cotización CP Data
        </h1>
        <p className="text-muted-foreground">
          Gestión de negocios y presupuestos para servicios de acreditación
        </p>
      </div>
      
      <div className="animate-slide-in-right">
        <Button 
          onClick={onCrearNegocio} 
          className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Crear Nuevo Negocio
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
