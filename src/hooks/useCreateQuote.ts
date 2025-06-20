
import { useState, useEffect } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { ProductoPresupuesto } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useProductosBiblioteca, ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';

type Step = 'selection' | 'editing';

interface UseCreateQuoteProps {
  negocioId: string;
  presupuestoId?: string | null;
  onCerrar: () => void;
}

export const useCreateQuote = ({ negocioId, presupuestoId, onCerrar }: UseCreateQuoteProps) => {
  const { obtenerNegocio, crearPresupuesto, actualizarPresupuesto } = useNegocio();
  const { productos: productosBiblioteca, loading: loadingProductos } = useProductosBiblioteca();
  const [step, setStep] = useState<Step>('selection');
  const [productos, setProductos] = useState<ProductoPresupuesto[]>([]);

  const negocio = obtenerNegocio(negocioId);
  const presupuestoExistente = presupuestoId ? 
    negocio?.presupuestos.find(p => p.id === presupuestoId) : null;

  useEffect(() => {
    if (presupuestoExistente) {
      setProductos(presupuestoExistente.productos);
      setStep('editing');
    }
  }, [presupuestoExistente]);

  const agregarProductoBiblioteca = (productoBiblioteca: ProductoBiblioteca) => {
    const nuevoProducto: ProductoPresupuesto = {
      id: `producto-${Date.now()}-${productoBiblioteca.id}`,
      nombre: productoBiblioteca.nombre,
      descripcion: productoBiblioteca.descripcion || '',
      cantidad: 1,
      precioUnitario: productoBiblioteca.precio_base,
      total: productoBiblioteca.precio_base
    };

    setProductos(prev => [...prev, nuevoProducto]);
  };

  const eliminarProducto = (id: string) => {
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const agregarProductoPersonalizado = (productoData: {
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }) => {
    const nuevoProducto: ProductoPresupuesto = {
      id: `producto-${Date.now()}`,
      ...productoData,
      total: productoData.cantidad * productoData.precioUnitario
    };

    setProductos(prev => [...prev, nuevoProducto]);
  };

  const actualizarProducto = (id: string, campo: keyof ProductoPresupuesto, valor: any) => {
    setProductos(prev => prev.map(producto => {
      if (producto.id === id) {
        const productoActualizado = { ...producto, [campo]: valor };
        
        // Manejo especial para precio unitario cuando está vacío
        if (campo === 'precioUnitario') {
          if (valor === '' || valor === null || valor === undefined) {
            productoActualizado.precioUnitario = 0;
            productoActualizado.total = 0;
          } else {
            const precio = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
            productoActualizado.precioUnitario = precio;
            productoActualizado.total = productoActualizado.cantidad * precio;
          }
        } else if (campo === 'cantidad') {
          const cantidad = typeof valor === 'number' ? valor : parseInt(valor) || 1;
          productoActualizado.cantidad = cantidad;
          const precio = typeof productoActualizado.precioUnitario === 'number' ? 
            productoActualizado.precioUnitario : parseFloat(String(productoActualizado.precioUnitario)) || 0;
          productoActualizado.total = cantidad * precio;
        }
        
        return productoActualizado;
      }
      return producto;
    }));
  };

  const calcularTotal = () => {
    return productos.reduce((total, producto) => total + producto.total, 0);
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
    setStep('editing');
  };

  const guardarPresupuesto = () => {
    if (productos.length === 0) {
      toast({
        title: "Sin productos",
        description: "Debe agregar al menos un producto al presupuesto",
        variant: "destructive"
      });
      return;
    }

    if (presupuestoId) {
      actualizarPresupuesto(negocioId, presupuestoId, productos);
      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto ha sido actualizado exitosamente",
      });
    } else {
      crearPresupuesto(negocioId, productos);
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto ha sido creado exitosamente",
      });
    }

    onCerrar();
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
