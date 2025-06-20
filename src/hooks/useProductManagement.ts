
import { useState } from 'react';
import { ProductoPresupuesto } from '@/types';
import { ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';
import { calcularTotalProducto } from '@/utils/quoteCalculations';

export const useProductManagement = (initialProducts: ProductoPresupuesto[] = []) => {
  const [productos, setProductos] = useState<ProductoPresupuesto[]>(initialProducts);

  const agregarProductoBiblioteca = (productoBiblioteca: ProductoBiblioteca) => {
    const nuevoProducto: ProductoPresupuesto = {
      id: `producto-${Date.now()}-${productoBiblioteca.id}`,
      nombre: productoBiblioteca.nombre,
      descripcion: productoBiblioteca.descripcion || '',
      cantidad: 1,
      precioUnitario: productoBiblioteca.precio_base,
      descuentoPorcentaje: 0,
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
      descuentoPorcentaje: 0,
      total: calcularTotalProducto(productoData.cantidad, productoData.precioUnitario, 0)
    };

    setProductos(prev => [...prev, nuevoProducto]);
  };

  const actualizarProducto = (id: string, campo: keyof ProductoPresupuesto, valor: any) => {
    setProductos(prev => prev.map(producto => {
      if (producto.id === id) {
        const productoActualizado = { ...producto, [campo]: valor };
        
        // Recalcular total cuando cambie precio, cantidad o descuento
        if (campo === 'precioUnitario' || campo === 'cantidad' || campo === 'descuentoPorcentaje') {
          if (campo === 'precioUnitario') {
            const precio = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
            productoActualizado.precioUnitario = precio;
          } else if (campo === 'cantidad') {
            const cantidad = typeof valor === 'number' ? valor : parseInt(valor) || 1;
            productoActualizado.cantidad = cantidad;
          } else if (campo === 'descuentoPorcentaje') {
            const descuento = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
            productoActualizado.descuentoPorcentaje = Math.max(0, Math.min(100, descuento));
          }
          
          productoActualizado.total = calcularTotalProducto(
            productoActualizado.cantidad,
            productoActualizado.precioUnitario,
            productoActualizado.descuentoPorcentaje
          );
        }
        
        return productoActualizado;
      }
      return producto;
    }));
  };

  const resetProductos = () => {
    setProductos([]);
  };

  const setProductosFromExternal = (newProductos: ProductoPresupuesto[]) => {
    setProductos(newProductos);
  };

  return {
    productos,
    agregarProductoBiblioteca,
    eliminarProducto,
    agregarProductoPersonalizado,
    actualizarProducto,
    resetProductos,
    setProductosFromExternal
  };
};
