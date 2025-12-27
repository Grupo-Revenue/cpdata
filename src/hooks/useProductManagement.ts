
import { useState, useCallback } from 'react';
import { ExtendedProductoPresupuesto, SessionAcreditacion } from '@/types';
import { ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';
import { calcularTotalProducto } from '@/utils/quoteCalculations';
import { ACREDITACION_LINEA_PRODUCTO_ID } from '@/constants/productLines';

export const useProductManagement = (initialProducts: ExtendedProductoPresupuesto[] = []) => {
  const [productos, setProductos] = useState<ExtendedProductoPresupuesto[]>(initialProducts);

  const agregarProductoBiblioteca = useCallback((productoBiblioteca: ProductoBiblioteca) => {
    // Verificar si es producto de acreditación por linea_producto_id o por nombre de categoría
    const isAccreditationProduct = 
      productoBiblioteca.linea_producto_id === ACREDITACION_LINEA_PRODUCTO_ID ||
      productoBiblioteca.linea_producto?.nombre?.toLowerCase() === 'acreditación' ||
      productoBiblioteca.nombre.toLowerCase().includes('acreditación') ||
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
      descuento_porcentaje: 0,
      total: productoBiblioteca.precio_base,
      created_at: new Date().toISOString(),
      presupuesto_id: '',
      linea_producto_id: productoBiblioteca.linea_producto_id,
      sessions: isAccreditationProduct ? [] : undefined,
      originalLibraryDescription: productoBiblioteca.descripcion || ''
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
      descuento_porcentaje: 0,
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
        const productoActualizado = { ...producto };
        
        // Handle sessions updates for accreditation products
        if (campo === 'sessions') {
          console.log('Updating sessions for product', id, 'with sessions:', valor);
          
          // Ensure we have a clean array of sessions
          if (Array.isArray(valor) && valor.length > 0) {
            // Deep clone sessions to avoid circular references and ensure proper typing
            productoActualizado.sessions = (valor as SessionAcreditacion[]).map(session => ({
              id: session.id,
              fecha: session.fecha,
              servicio: session.servicio,
              acreditadores: session.acreditadores || 0,
              supervisor: session.supervisor || 0,
              precio: session.precio || 0,
              monto: session.monto || session.precio || 0,
              observacion: session.observacion || ''
            }));
            
            // Calculate totals based on sessions
            const sessionsTotalAmount = productoActualizado.sessions.reduce((sum: number, session: SessionAcreditacion) => sum + (Number(session.monto) || 0), 0);
            
            // Calculate base product total (original price * quantity - discount)
            const basePrice = Number(productoActualizado.precio_unitario) || Number(productoActualizado.precioUnitario) || 0;
            const baseQuantity = Number(productoActualizado.cantidad) || 1;
            const discount = Number(productoActualizado.descuentoPorcentaje) || 0;
            const baseTotal = calcularTotalProducto(baseQuantity, basePrice, discount);
            
            // Store breakdown for clarity
            (productoActualizado as any).baseTotal = baseTotal;
            (productoActualizado as any).sessionsTotal = sessionsTotalAmount;
            
            // Total = base product value + sessions value
            const totalSum = Number(baseTotal) + Number(sessionsTotalAmount);
            productoActualizado.total = totalSum as any;
            
            console.log('Sessions updated successfully:', {
              sessionsCount: productoActualizado.sessions.length,
              baseTotal: baseTotal,
              sessionsTotal: sessionsTotalAmount,
              totalAmount: productoActualizado.total
            });
          } else {
            // Clear sessions if empty or invalid
            productoActualizado.sessions = undefined;
            (productoActualizado as any).baseTotal = undefined;
            (productoActualizado as any).sessionsTotal = undefined;
            
            // Recalculate total without sessions
            const basePrice = Number(productoActualizado.precio_unitario) || Number(productoActualizado.precioUnitario) || 0;
            const baseQuantity = Number(productoActualizado.cantidad) || 1;
            const discount = Number(productoActualizado.descuentoPorcentaje) || 0;
            productoActualizado.total = calcularTotalProducto(baseQuantity, basePrice, discount) as any;
            
            console.log('Sessions cleared for product', id);
          }
        }
        // Handle legacy property name mapping
        else if (campo === 'precioUnitario') {
          productoActualizado.precio_unitario = valor;
          productoActualizado.precioUnitario = valor;
        } else if (campo === 'precio_unitario') {
          productoActualizado.precioUnitario = valor;
          productoActualizado.precio_unitario = valor;
        } else if (campo === 'comentarios') {
          productoActualizado.comentarios = valor;
        } else if (campo === 'cantidad') {
          productoActualizado.cantidad = valor;
        } else if (campo === 'descuentoPorcentaje') {
          productoActualizado.descuentoPorcentaje = valor;
          productoActualizado.descuento_porcentaje = valor;
        } else if (campo === 'total') {
          productoActualizado.total = valor;
        } else if (campo === 'nombre') {
          productoActualizado.nombre = valor;
        } else if (campo === 'descripcion') {
          productoActualizado.descripcion = valor;
        }
        
        // Recalculate total for price/quantity/discount changes (but not for sessions as they're handled above)
        if (campo !== 'sessions' && ['precioUnitario', 'precio_unitario', 'cantidad', 'descuentoPorcentaje'].includes(campo)) {
          const currentPrecio = Number(productoActualizado.precio_unitario) || Number(productoActualizado.precioUnitario) || 0;
          const currentCantidad = Number(productoActualizado.cantidad) || 1;
          const currentDescuento = Number(productoActualizado.descuentoPorcentaje) || 0;
          
          let precio = currentPrecio;
          let cantidad = currentCantidad;
          let descuento = currentDescuento;
          
          // Handle the specific field being updated with proper type conversion and validation
          if (campo === 'precioUnitario' || campo === 'precio_unitario') {
            precio = typeof valor === 'number' ? Math.max(0, valor) : Math.max(0, parseFloat(valor) || 0);
            productoActualizado.precioUnitario = precio;
            productoActualizado.precio_unitario = precio as any;
          } else if (campo === 'cantidad') {
            cantidad = typeof valor === 'number' ? Math.max(1, Math.floor(valor)) : Math.max(1, parseInt(valor) || 1);
            productoActualizado.cantidad = cantidad as any;
          } else if (campo === 'descuentoPorcentaje') {
            descuento = typeof valor === 'number' ? Math.max(0, Math.min(100, valor)) : Math.max(0, Math.min(100, parseFloat(valor) || 0));
            productoActualizado.descuentoPorcentaje = descuento;
            productoActualizado.descuento_porcentaje = descuento;
          }
          
          // Calculate new base total
          const newBaseTotal = calcularTotalProducto(cantidad, precio, descuento);
          
          // If product has sessions, add them to the base total
          if (productoActualizado.sessions && productoActualizado.sessions.length > 0) {
            const sessionsTotal = productoActualizado.sessions.reduce((sum: number, session: SessionAcreditacion) => sum + (Number(session.monto) || 0), 0);
            (productoActualizado as any).baseTotal = newBaseTotal;
            (productoActualizado as any).sessionsTotal = sessionsTotal;
            const totalSum = Number(newBaseTotal) + Number(sessionsTotal);
            productoActualizado.total = totalSum as any;
          } else {
            productoActualizado.total = newBaseTotal as any;
            (productoActualizado as any).baseTotal = undefined;
            (productoActualizado as any).sessionsTotal = undefined;
          }
        }
        
        console.log('Product updated', { 
          id, 
          campo, 
          hasSessionsAfterUpdate: !!productoActualizado.sessions,
          sessionsCount: productoActualizado.sessions?.length || 0,
          totalAmount: productoActualizado.total
        });
        
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
      // Verificar si es producto de acreditación por linea_producto_id o por nombre
      const isAccreditationProduct = 
        producto.linea_producto_id === ACREDITACION_LINEA_PRODUCTO_ID ||
        producto.nombre.toLowerCase().includes('acreditación') ||
        producto.descripcion?.toLowerCase().includes('acreditación');

      return {
        ...producto,
        comentarios: producto.comentarios || '',
        descuentoPorcentaje: producto.descuentoPorcentaje || 0,
        descuento_porcentaje: producto.descuentoPorcentaje || producto.descuento_porcentaje || 0,
        precioUnitario: producto.precioUnitario || producto.precio_unitario,
        sessions: producto.sessions || (isAccreditationProduct ? [] : undefined),
        originalLibraryDescription: producto.originalLibraryDescription || producto.descripcion || ''
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
