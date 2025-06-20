
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
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay presupuestos</h3>
      <p className="text-gray-600 mb-6">Comienza creando el primer presupuesto para este negocio</p>
      <Button 
        onClick={onCrearPresupuesto} 
        size="lg"
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
      >
        <Plus className="w-5 h-5 mr-2" />
        Crear Primer Presupuesto
      </Button>
    </div>
  );
};

export default EmptyPresupuestosState;
