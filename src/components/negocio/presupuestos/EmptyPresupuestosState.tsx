
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

interface EmptyPresupuestosStateProps {
  onCrearPresupuesto: () => void;
}

const EmptyPresupuestosState: React.FC<EmptyPresupuestosStateProps> = ({
  onCrearPresupuesto
}) => {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200">
        <FileText className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">No hay presupuestos</h3>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        Comienza creando el primer presupuesto para este negocio y dale seguimiento a tu proyecto.
      </p>
      <Button 
        onClick={onCrearPresupuesto} 
        size="lg"
        className="bg-slate-900 text-white hover:bg-slate-800 font-medium"
      >
        <Plus className="w-5 h-5 mr-2" />
        Crear Primer Presupuesto
      </Button>
    </div>
  );
};

export default EmptyPresupuestosState;
