import { useState, useCallback } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { ProductoPresupuesto } from '@/types';
import { toast } from '@/hooks/use-toast';
import { generateQuoteName } from '@/utils/quoteNameGenerator';

interface UseQuotePersistenceProps {
  negocioId: string;
  presupuestoId?: string | null;
  onCerrar: () => void;
}

export const useQuotePersistence = ({ negocioId, presupuestoId, onCerrar }: UseQuotePersistenceProps) => {
  const { obtenerNegocio, crearPresupuesto, actualizarPresupuesto } = useNegocio();
  const [isSaving, setIsSaving] = useState(false);

  const negocio = obtenerNegocio(negocioId);
  const presupuestoExistente = presupuestoId ? 
    negocio?.presupuestos.find(p => p.id === presupuestoId) : null;

  const guardarPresupuesto = useCallback(async (productos: ProductoPresupuesto[]) => {
    if (isSaving) {
      console.log('💡 [useQuotePersistence] Save operation already in progress, ignoring...');
      return;
    }

    if (productos.length === 0) {
      console.warn('⚠️ [useQuotePersistence] No products to save');
      toast({
        title: "Sin productos",
        description: "Debe agregar al menos un producto al presupuesto",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      console.log('💾 [useQuotePersistence] Starting save operation:', {
        presupuestoId,
        negocioId,
        productCount: productos.length,
        isUpdate: !!presupuestoId
      });

      // Calculate total from products
      const total = productos.reduce((sum, producto) => {
        const productTotal = producto.cantidad * producto.precio_unitario;
        console.log(`📊 [useQuotePersistence] Product calculation: ${producto.nombre} = ${producto.cantidad} × ${producto.precio_unitario} = ${productTotal}`);
        return sum + productTotal;
      }, 0);

      console.log('📊 [useQuotePersistence] Total calculated:', total);

      // Generate quote name using business number + sequential letter format
      let quoteName: string;
      if (presupuestoId) {
        // For updates, keep the existing name
        quoteName = presupuestoExistente?.nombre || `Presupuesto ${new Date().toLocaleDateString()}`;
        console.log('🏷️ [useQuotePersistence] Using existing quote name:', quoteName);
      } else {
        // For new quotes, generate name using business number + letter
        if (negocio) {
          quoteName = generateQuoteName(negocio, negocio.presupuestos || []);
          console.log('🏷️ [useQuotePersistence] Generated new quote name:', quoteName);
        } else {
          quoteName = `Presupuesto ${new Date().toLocaleDateString()}`;
          console.log('🏷️ [useQuotePersistence] Using fallback quote name:', quoteName);
        }
      }

      // Validate business exists
      if (!negocio) {
        throw new Error('No se encontró el negocio. Refresque la página e intente nuevamente.');
      }

      // Create clean presupuesto data with proper validation
      const presupuestoData = {
        nombre: quoteName,
        estado: 'borrador' as const,
        total: Number(total) || 0,
        facturado: false,
        negocio_id: negocioId,
        fecha_envio: null,
        fecha_aprobacion: null,
        fecha_rechazo: null,
        fecha_vencimiento: null,
        fechaCreacion: new Date().toISOString(),
        fechaEnvio: null,
        fechaAprobacion: null,
        fechaRechazo: null,
        // Convert products to the format expected by the service
        productos: productos.map(producto => {
          const cleanProduct = {
            id: producto.id || `temp-${Date.now()}-${Math.random()}`,
            nombre: producto.nombre || 'Producto sin nombre',
            descripcion: producto.descripcion || '',
            cantidad: Number(producto.cantidad) || 1,
            precio_unitario: Number(producto.precio_unitario) || 0,
            total: Number(producto.cantidad || 1) * Number(producto.precio_unitario || 0),
            created_at: new Date().toISOString(),
            presupuesto_id: presupuestoId || '',
            // Add extended properties for compatibility
            comentarios: producto.comentarios || '',
            descuentoPorcentaje: Number(producto.descuentoPorcentaje) || 0,
            precioUnitario: Number(producto.precio_unitario) || 0,
            sessions: producto.sessions || null
          };
          
          console.log('🔧 [useQuotePersistence] Cleaned product:', {
            nombre: cleanProduct.nombre,
            cantidad: cleanProduct.cantidad,
            precio_unitario: cleanProduct.precio_unitario,
            sessions: cleanProduct.sessions ? 'has sessions' : 'no sessions'
          });
          
          return cleanProduct;
        })
      };

      console.log('📋 [useQuotePersistence] Final presupuesto data:', {
        nombre: presupuestoData.nombre,
        total: presupuestoData.total,
        productCount: presupuestoData.productos.length,
        negocio_id: presupuestoData.negocio_id
      });

      if (presupuestoId) {
        console.log('🔄 [useQuotePersistence] Updating existing presupuesto:', presupuestoId);
        
        // For updates, update presupuesto using context method
        const updateData = {
          nombre: presupuestoData.nombre,
          estado: presupuestoData.estado,
          total: presupuestoData.total,
          facturado: presupuestoData.facturado
        };
        
        console.log('🔄 [useQuotePersistence] Calling actualizarPresupuesto with:', {
          negocioId,
          presupuestoId,
          updateData,
          productCount: productos.length,
          productsWithSessions: productos.filter(p => p.sessions && p.sessions.length > 0).length
        });
        
        // Include products in update for sessions persistence
        const result = await actualizarPresupuesto(negocioId, presupuestoId, updateData, productos);
        
        if (!result) {
          throw new Error('No se recibió confirmación de la actualización del presupuesto');
        }
        
        console.log('✅ [useQuotePersistence] Presupuesto updated successfully:', result.id);
        
        // UI will be updated by the context refresh mechanism
        
        toast({
          title: "Presupuesto actualizado",
          description: "El presupuesto ha sido actualizado exitosamente",
        });
      } else {
        console.log('🆕 [useQuotePersistence] Creating new presupuesto');
        
        console.log('🆕 [useQuotePersistence] Calling crearPresupuesto with:', {
          negocioId,
          presupuestoData: {
            nombre: presupuestoData.nombre,
            total: presupuestoData.total,
            productCount: presupuestoData.productos.length
          }
        });
        
        const result = await crearPresupuesto(negocioId, presupuestoData);
        
        if (!result) {
          throw new Error('No se recibió confirmación de la creación del presupuesto');
        }
        
        console.log('✅ [useQuotePersistence] Presupuesto created successfully:', result.id);
        
        // UI will be updated by the context refresh mechanism
        
        toast({
          title: "Presupuesto creado",
          description: `El presupuesto ${quoteName} ha sido guardado exitosamente`,
        });
      }

      // Close and return to business detail page after successful save
      console.log('🚀 [useQuotePersistence] Save operation completed, closing...');
      onCerrar();
      
    } catch (error) {
      console.error('❌ [useQuotePersistence] Error saving presupuesto:', error);
      
      // Provide more specific error messages
      let errorMessage = "No se pudo guardar el presupuesto";
      if (error instanceof Error) {
        console.error('❌ [useQuotePersistence] Detailed error:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        if (error.message.includes('productos')) {
          errorMessage = "Error al guardar los productos del presupuesto";
        } else if (error.message.includes('column') || error.message.includes('does not exist')) {
          errorMessage = "Error de estructura de datos. Contacte al administrador.";
        } else if (error.message.includes('not found') || error.message.includes('no encontró')) {
          errorMessage = "Datos no encontrados. Refresque la página e intente nuevamente.";
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = "No tiene permisos para realizar esta operación";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      console.log('🏁 [useQuotePersistence] Save operation finished');
    }
  }, [isSaving, presupuestoId, presupuestoExistente, negocio, negocioId, crearPresupuesto, actualizarPresupuesto, onCerrar]);

  return {
    negocio,
    presupuestoExistente,
    presupuestoId,
    guardarPresupuesto,
    isSaving
  };
};
