
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Negocio } from '@/types';

interface CreateQuoteHeaderProps {
  negocio: Negocio;
  presupuestoId?: string | null;
  onCerrar: () => void;
  step: 'selection' | 'editing';
  productosCount: number;
  total: number;
  onProceedToEdit: () => void;
  onVolverASeleccion?: () => void;
}

const CreateQuoteHeader: React.FC<CreateQuoteHeaderProps> = ({
  negocio,
  presupuestoId,
  onCerrar,
  step,
  productosCount,
  total,
  onProceedToEdit,
  onVolverASeleccion
}) => {
  return (
    <div className="mb-6">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={onCerrar}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {presupuestoId ? 'Editar' : 'Crear'} Presupuesto
              </h1>
              <p className="text-sm text-gray-600">
                Negocio #{negocio.numero} • {negocio.evento.nombreEvento}
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator for editing mode */}
        {step === 'editing' && onVolverASeleccion && (
          <Button 
            variant="outline" 
            onClick={onVolverASeleccion}
            className="text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Selección
          </Button>
        )}
      </div>

      {/* Step Description */}
      <div className="py-3">
        {step === 'selection' ? (
          <div>
            <p className="text-gray-700 font-medium">
              Paso 1: Selecciona productos
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Elige productos de la biblioteca o crea productos personalizados para este presupuesto
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 font-medium">
              Paso 2: Ajusta detalles
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Modifica cantidades, precios y descripciones de los productos seleccionados
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateQuoteHeader;
