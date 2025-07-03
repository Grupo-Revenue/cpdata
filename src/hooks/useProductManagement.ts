
import { useState, useCallback } from 'react';
import { ExtendedProductoPresupuesto } from '@/types';
import { ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';
import { calcularTotalProducto } from '@/utils/quoteCalculations';

export const useProductManagement = (initialProducts: ExtendedProductoPresupuesto[] = []) => {
  const [productos, setProductos] = useState<ExtendedProductoPresupuesto[]>(initialProducts);

  const agregarProductoBiblioteca = useCallback((productoBiblioteca: ProductoBiblioteca) => {
    const isAccreditationProduct = productoBiblioteca.nombre.toLowerCase().includes('acreditación') ||
      productoBiblioteca.descripcion?.toLowerCase().includes('acreditación');

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
      presupuesto_id: '',
      sessions: isAccreditationProduct ? [] : undefined
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
    const isAccreditationProduct = productoData.nombre.toLowerCase().includes('acreditación') ||
      productoData.descripcion?.toLowerCase().includes('acreditación');

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
      presupuesto_id: '',
      sessions: isAccreditationProduct ? [] : undefined
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
        
        // Handle sessions updates for accreditation products
        if (campo === 'sessions') {
          productoActualizado.sessions = valor;
          
          // If sessions exist, update the total price based on sessions total
          if (valor && Array.isArray(valor) && valor.length > 0) {
            const sessionsTotalAmount = valor.reduce((sum: number, session: any) => sum + (session.monto || 0), 0);
            const sessionsTotalQuantity = valor.reduce((sum: number, session: any) => sum + (session.cantidad || 0), 0);
            
            // Update product totals based on sessions
            productoActualizado.total = sessionsTotalAmount;
            productoActualizado.cantidad = sessionsTotalQuantity;
            // Keep the original unit price or calculate average
            if (sessionsTotalQuantity > 0) {
              productoActualizado.precio_unitario = sessionsTotalAmount / sessionsTotalQuantity;
              productoActualizado.precioUnitario = sessionsTotalAmount / sessionsTotalQuantity;
            }
          }
        }
        // Recalcular total cuando cambie precio, cantidad o descuento (but not for sessions)
        else if (campo === 'precioUnitario' || campo === 'precio_unitario' || campo === 'cantidad' || campo === 'descuentoPorcentaje') {
          let precio = productoActualizado.precioUnitario || productoActualizado.precio_unitario;
          let cantidad = productoActualizado.cantidad;
          let descuento = productoActualizado.descuentoPorcentaje || 0;
          
          // Handle the specific field being updated with proper type conversion and validation
          if (campo === 'precioUnitario' || campo === 'precio_unitario') {
            // Convert to number, ensure it's not negative, default to 0 if invalid
            precio = typeof valor === 'number' ? Math.max(0, valor) : Math.max(0, parseFloat(valor) || 0);
            productoActualizado.precioUnitario = precio;
            productoActualizado.precio_unitario = precio;
          } else if (campo === 'cantidad') {
            // Convert to integer, ensure it's at least 1, default to 1 if invalid
            cantidad = typeof valor === 'number' ? Math.max(1, Math.floor(valor)) : Math.max(1, parseInt(valor) || 1);
            productoActualizado.cantidad = cantidad;
          } else if (campo === 'descuentoPorcentaje') {
            // Convert to number, clamp between 0-100, default to 0 if invalid
            descuento = typeof valor === 'number' ? Math.max(0, Math.min(100, valor)) : Math.max(0, Math.min(100, parseFloat(valor) || 0));
            productoActualizado.descuentoPorcentaje = descuento;
          }
          
          productoActualizado.total = calcularTotalProducto(cantidad, precio, descuento);
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
    const productosExtendidos = newProductos.map(producto => {
      const isAccreditationProduct = producto.nombre.toLowerCase().includes('acreditación') ||
        producto.descripcion?.toLowerCase().includes('acreditación');

      return {
        ...producto,
        comentarios: producto.comentarios || '',
        descuentoPorcentaje: producto.descuentoPorcentaje || 0,
        precioUnitario: producto.precioUnitario || producto.precio_unitario,
        sessions: producto.sessions || (isAccreditationProduct ? [] : undefined)
      };
    });
    
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
