
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { formatearPrecio } from '@/utils/formatters';
import { Negocio } from '@/types';

interface CreateQuoteHeaderProps {
  negocio: Negocio;
  presupuestoId?: string | null;
  onCerrar: () => void;
  step: 'selection' | 'editing';
  productosCount: number;
  total: number;
  onProceedToEdit: () => void;
}

const CreateQuoteHeader: React.FC<CreateQuoteHeaderProps> = ({
  negocio,
  presupuestoId,
  onCerrar,
  step,
  productosCount,
  total,
  onProceedToEdit
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onCerrar}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {presupuestoId ? 'Editar' : 'Crear'} Presupuesto
          </h1>
          <p className="text-gray-600">Negocio #{negocio.numero} - {negocio.evento.nombreEvento}</p>
        </div>
      </div>
      {step === 'selection' && (
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Productos seleccionados: {productosCount}</p>
            <p className="text-xl font-bold text-green-600">{formatearPrecio(total)}</p>
          </div>
          <Button 
            onClick={onProceedToEdit}
            disabled={productosCount === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continuar con Edición
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreateQuoteHeader;
