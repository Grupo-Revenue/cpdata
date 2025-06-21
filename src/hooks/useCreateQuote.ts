
import { useEffect, useCallback } from 'react';
import { useProductosBiblioteca } from '@/hooks/useProductosBiblioteca';
import { calcularTotalesPresupuesto, QuoteTotals } from '@/utils/quoteCalculations';
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

  // Load existing quote data with proper memoization
  useEffect(() => {
    console.log('useCreateQuote: checking presupuestoExistente', { presupuestoExistente, presupuestoId });
    
    if (presupuestoExistente && presupuestoExistente.productos) {
      console.log('useCreateQuote: loading existing productos', presupuestoExistente.productos);
      
      // Asegurar que todos los productos tengan el campo descuentoPorcentaje
      const productosConDescuento = presupuestoExistente.productos.map(producto => ({
        ...producto,
        descuentoPorcentaje: producto.descuentoPorcentaje || 0
      }));
      
      setProductosFromExternal(productosConDescuento);
      setStep('editing');
    }
  }, [presupuestoExistente?.id, setProductosFromExternal, setStep]); // Only depend on the ID to avoid infinite loops

  const calcularTotal = useCallback((): number => {
    const totales = calcularTotalesPresupuesto(productos);
    return totales.total;
  }, [productos]);

  const calcularTotales = useCallback((): QuoteTotals => {
    return calcularTotalesPresupuesto(productos);
  }, [productos]);

  const proceedToEdit = useCallback(() => {
    if (productos.length === 0) {
      toast({
        title: "Sin productos",
        description: "Debe seleccionar al menos un producto para continuar",
        variant: "destructive"
      });
      return;
    }
    baseProccedToEdit();
  }, [productos.length, baseProccedToEdit]);

  const guardarPresupuesto = useCallback(() => {
    baseSaveQuote(productos);
  }, [baseSaveQuote, productos]);

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
    calcularTotales,
    proceedToEdit,
    guardarPresupuesto
  };
};
