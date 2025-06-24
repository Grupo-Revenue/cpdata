
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Negocio } from '@/types';

interface PresupuestosCardHeaderProps {
  negocio: Negocio;
  onCrearPresupuesto: () => void;
}

const PresupuestosCardHeader: React.FC<PresupuestosCardHeaderProps> = ({
  negocio,
  onCrearPresupuesto
}) => {
  return (
    <CardHeader className="pb-6">
      <div className="flex items-center justify-between">
        <CardTitle className="text-2xl text-slate-900">Presupuestos</CardTitle>
        <Button 
          onClick={onCrearPresupuesto} 
          className="bg-slate-900 text-white hover:bg-slate-800 font-medium"
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>
    </CardHeader>
  );
};

export default PresupuestosCardHeader;
