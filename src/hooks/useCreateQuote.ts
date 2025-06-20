
import { useEffect } from 'react';
import { useProductosBiblioteca } from '@/hooks/useProductosBiblioteca';
import { calcularTotalesPresupuesto } from '@/utils/quoteCalculations';
import { useProductManagement } from '@/hooks/useProductManagement';
import { useQuoteFormState } from '@/hooks/useQuoteFormState';
import { useQuotePersistence } from '@/hooks/useQuotePersistence';
import { toast } from '@/hooks/use-toast';

interface UseCreateQuoteProps {
  negocioId: string;
  presupuestoId?: string | null;
  onCerrar: () => void;
}

export const useCreateQuote = ({ negocioId, presupuestoId, onCerrar }: UseCreateQuoteProps) => {
  const { productos: productosBiblioteca, loading: loadingProductos } = useProductosBiblioteca();
  
  const {
    productos,
    agregarProductoBiblioteca,
    eliminarProducto,
    agregarProductoPersonalizado,
    actualizarProducto,
    setProductosFromExternal
  } = useProductManagement();

  const {
    step,
    setStep,
    proceedToEdit: baseProccedToEdit,
    backToSelection
  } = useQuoteFormState();

  const {
    negocio,
    presupuestoExistente,
    guardarPresupuesto: baseSaveQuote
  } = useQuotePersistence({ negocioId, presupuestoId, onCerrar });

  // Load existing quote data
  useEffect(() => {
    if (presupuestoExistente) {
      // Asegurar que todos los productos tengan el campo descuentoPorcentaje
      const productosConDescuento = presupuestoExistente.productos.map(producto => ({
        ...producto,
        descuentoPorcentaje: producto.descuentoPorcentaje || 0
      }));
      setProductosFromExternal(productosConDescuento);
      setStep('editing');
    }
  }, [presupuestoExistente, setProductosFromExternal, setStep]);

  const calcularTotal = () => {
    const totales = calcularTotalesPresupuesto(productos);
    return totales.total;
  };

  const proceedToEdit = () => {
    if (productos.length === 0) {
      toast({
        title: "Sin productos",
        description: "Debe seleccionar al menos un producto para continuar",
        variant: "destructive"
      });
      return;
    }
    baseProccedToEdit();
  };

  const guardarPresupuesto = () => {
    baseSaveQuote(productos);
  };

  return {
    negocio,
    step,
    productos,
    productosBiblioteca,
    loadingProductos,
    presupuestoId,
    setStep,
    agregarProductoBiblioteca,
    eliminarProducto,
    agregarProductoPersonalizado,
    actualizarProducto,
    calcularTotal,
    proceedToEdit,
    guardarPresupuesto
  };
};
