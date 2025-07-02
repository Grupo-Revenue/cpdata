
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateQuote } from '@/hooks/useCreateQuote';
import CreateQuoteHeader from './presupuesto/CreateQuoteHeader';
import CreateQuoteSelection from './presupuesto/CreateQuoteSelection';
import QuoteEditView from './presupuesto/QuoteEditView';

interface CrearPresupuestoProps {
  negocioId: string;
  presupuestoId?: string | null;
  onCerrar: () => void;
}

const CrearPresupuesto: React.FC<CrearPresupuestoProps> = ({ negocioId, presupuestoId, onCerrar }) => {
  const {
    negocio,
    step,
    productos,
    productosBiblioteca,
    loadingProductos,
    setStep,
    agregarProductoBiblioteca,
    eliminarProducto,
    agregarProductoPersonalizado,
    actualizarProducto,
    calcularTotal,
    proceedToEdit,
    guardarPresupuesto,
    volverASeleccion
  } = useCreateQuote({ negocioId, presupuestoId, onCerrar });

  if (!negocio) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Negocio no encontrado</p>
          <Button onClick={onCerrar} variant="outline">Volver</Button>
        </div>
      </div>
    );
  }

  if (loadingProductos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <CreateQuoteHeader
            negocio={negocio}
            presupuestoId={presupuestoId}
            onCerrar={onCerrar}
            step={step}
            productosCount={productos.length}
            total={calcularTotal()}
            onProceedToEdit={proceedToEdit}
            onVolverASeleccion={step === 'editing' ? volverASeleccion : undefined}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {step === 'selection' ? (
          <CreateQuoteSelection
            productosBiblioteca={productosBiblioteca}
            productosSeleccionados={productos}
            onProductoSeleccionado={agregarProductoBiblioteca}
            onProductoDeseleccionado={eliminarProducto}
            onAgregarProductoPersonalizado={agregarProductoPersonalizado}
            onProceedToEdit={proceedToEdit}
            loading={loadingProductos}
          />
        ) : (
          <QuoteEditView
            productos={productos}
            onActualizarProducto={actualizarProducto}
            onEliminarProducto={eliminarProducto}
            onVolver={volverASeleccion}
            onConfirmar={guardarPresupuesto}
            total={calcularTotal()}
          />
        )}
      </div>
    </div>
  );
};

export default CrearPresupuesto;
