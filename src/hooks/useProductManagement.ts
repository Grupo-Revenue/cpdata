
import { useState, useCallback } from 'react';
import { ExtendedProductoPresupuesto } from '@/types';
import { ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';
import { calcularTotalProducto } from '@/utils/quoteCalculations';

export const useProductManagement = (initialProducts: ExtendedProductoPresupuesto[] = []) => {
  const [productos, setProductos] = useState<ExtendedProductoPresupuesto[]>(initialProducts);

  const agregarProductoBiblioteca = useCallback((productoBiblioteca: ProductoBiblioteca) => {
    const nuevoProducto: ExtendedProductoPresupuesto = {
      id: `producto-${Date.now()}-${productoBiblioteca.id}`,
      nombre: productoBiblioteca.nombre,
      descripcion: productoBiblioteca.descripcion || '',
      comentarios: '',
      cantidad: 1,
      precio_unitario: productoBiblioteca.precio_base,
      precioUnitario: productoBiblioteca.precio_base,
      descuentoPorcentaje: 0,
      total: productoBiblioteca.precio_base,
      created_at: new Date().toISOString(),
      presupuesto_id: ''
    };

    setProductos(prev => [...prev, nuevoProducto]);
  }, []);

  const eliminarProducto = useCallback((id: string) => {
    setProductos(prev => prev.filter(p => p.id !== id));
  }, []);

  const agregarProductoPersonalizado = useCallback((productoData: {
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }) => {
    const nuevoProducto: ExtendedProductoPresupuesto = {
      id: `producto-${Date.now()}`,
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      cantidad: productoData.cantidad,
      precio_unitario: productoData.precioUnitario,
      precioUnitario: productoData.precioUnitario,
      comentarios: '',
      descuentoPorcentaje: 0,
      total: calcularTotalProducto(productoData.cantidad, productoData.precioUnitario, 0),
      created_at: new Date().toISOString(),
      presupuesto_id: ''
    };

    setProductos(prev => [...prev, nuevoProducto]);
  }, []);

  const actualizarProducto = useCallback((id: string, campo: keyof ExtendedProductoPresupuesto, valor: any) => {
    console.log('actualizarProducto called', { id, campo, valor });
    
    setProductos(prev => prev.map(producto => {
      if (producto.id === id) {
        const productoActualizado = { ...producto, [campo]: valor };
        
        // Handle legacy property name mapping
        if (campo === 'precioUnitario') {
          productoActualizado.precio_unitario = valor;
          productoActualizado.precioUnitario = valor;
        } else if (campo === 'precio_unitario') {
          productoActualizado.precioUnitario = valor;
          productoActualizado.precio_unitario = valor;
        }
        
        // Recalcular total cuando cambie precio, cantidad o descuento
        if (campo === 'precioUnitario' || campo === 'precio_unitario' || campo === 'cantidad' || campo === 'descuentoPorcentaje') {
          if (campo === 'precioUnitario' || campo === 'precio_unitario') {
            const precio = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
            productoActualizado.precioUnitario = precio;
            productoActualizado.precio_unitario = precio;
          } else if (campo === 'cantidad') {
            const cantidad = typeof valor === 'number' ? valor : parseInt(valor) || 1;
            productoActualizado.cantidad = cantidad;
          } else if (campo === 'descuentoPorcentaje') {
            const descuento = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
            productoActualizado.descuentoPorcentaje = Math.max(0, Math.min(100, descuento));
          }
          
          productoActualizado.total = calcularTotalProducto(
            productoActualizado.cantidad,
            productoActualizado.precioUnitario || productoActualizado.precio_unitario,
            productoActualizado.descuentoPorcentaje || 0
          );
        }
        
        console.log('Product updated', { original: producto, updated: productoActualizado });
        return productoActualizado;
      }
      return producto;
    }));
  }, []);

  const resetProductos = useCallback(() => {
    setProductos([]);
  }, []);

  const setProductosFromExternal = useCallback((newProductos: ExtendedProductoPresupuesto[]) => {
    console.log('setProductosFromExternal called with', newProductos);
    
    // Ensure backward compatibility by adding missing fields
    const productosExtendidos = newProductos.map(producto => ({
      ...producto,
      comentarios: producto.comentarios || '',
      descuentoPorcentaje: producto.descuentoPorcentaje || 0,
      precioUnitario: producto.precioUnitario || producto.precio_unitario
    }));
    
    setProductos(productosExtendidos);
  }, []);

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
