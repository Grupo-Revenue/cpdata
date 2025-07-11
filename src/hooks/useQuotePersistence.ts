import { useState, useCallback } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { ProductoPresupuesto } from '@/types';
import { toast } from '@/hooks/use-toast';
import { generateQuoteName } from '@/utils/quoteNameGenerator';
import { actualizarPresupuestoEnSupabase } from '@/services/presupuestoService';

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
      console.log('Ya hay un guardado en progreso, ignorando...');
      return;
    }

    if (productos.length === 0) {
      toast({
        title: "Sin productos",
        description: "Debe agregar al menos un producto al presupuesto",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    console.log('Saving presupuesto with products:', productos);

    // Calculate total from products
    const total = productos.reduce((sum, producto) => {
      return sum + (producto.cantidad * producto.precio_unitario);
    }, 0);

    // Generate quote name using business number + sequential letter format
    let quoteName: string;
    if (presupuestoId) {
      // For updates, keep the existing name
      quoteName = presupuestoExistente?.nombre || `Presupuesto ${new Date().toLocaleDateString()}`;
    } else {
      // For new quotes, generate name using business number + letter
      if (negocio) {
        quoteName = generateQuoteName(negocio, negocio.presupuestos || []);
      } else {
        quoteName = `Presupuesto ${new Date().toLocaleDateString()}`;
      }
    }

    // Create clean presupuesto data with only database-compatible properties
    const presupuestoData = {
      nombre: quoteName,
      estado: 'borrador' as const,
      total,
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
      // Convert products to the basic format expected by the service
      productos: productos.map(producto => ({
        id: producto.id || `temp-${Date.now()}-${Math.random()}`,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        cantidad: producto.cantidad,
        precio_unitario: producto.precio_unitario,
        total: producto.cantidad * producto.precio_unitario,
        created_at: new Date().toISOString(),
        presupuesto_id: presupuestoId || '',
        // Add extended properties for compatibility
        comentarios: producto.comentarios || '',
        descuentoPorcentaje: producto.descuentoPorcentaje || 0,
        precioUnitario: producto.precio_unitario,
        sessions: producto.sessions || undefined
      }))
    };

    try {
      if (presupuestoId) {
        console.log('Updating existing presupuesto:', presupuestoId);
        console.log('Products with sessions to update:', productos.map(p => ({ 
          nombre: p.nombre, 
          sessions: p.sessions, 
          sessionCount: p.sessions?.length || 0 
        })));
        
        // For updates, update presupuesto and products with sessions
        const updateData = {
          nombre: presupuestoData.nombre,
          estado: presupuestoData.estado,
          total: presupuestoData.total,
          facturado: presupuestoData.facturado
        };
        
        console.log('About to call actualizarPresupuestoEnSupabase with:', { presupuestoId, updateData, productCount: productos.length });
        await actualizarPresupuestoEnSupabase(presupuestoId, updateData, productos);
        console.log('actualizarPresupuestoEnSupabase completed successfully');
        
        toast({
          title: "Presupuesto actualizado",
          description: "El presupuesto ha sido actualizado exitosamente",
        });
      } else {
        console.log('Creating new presupuesto for negocio:', negocioId);
        console.log('Presupuesto data:', presupuestoData);
        console.log('Product count:', productos.length);
        
        if (!negocio) {
          throw new Error('No se encontró el negocio. Refresque la página e intente nuevamente.');
        }
        
        console.log('About to call crearPresupuesto');
        const result = await crearPresupuesto(negocioId, presupuestoData);
        console.log('crearPresupuesto result:', result);
        
        if (!result) {
          throw new Error('Error al crear el presupuesto - no se recibió respuesta del servidor');
        }
        
        toast({
          title: "Presupuesto creado",
          description: `El presupuesto ${quoteName} ha sido guardado exitosamente`,
        });
      }

      // Close and return to business detail page after successful save
      onCerrar();
    } catch (error) {
      console.error('Error saving presupuesto:', error);
      
      // Provide more specific error messages
      let errorMessage = "No se pudo guardar el presupuesto";
      if (error instanceof Error) {
        console.error('Detailed error:', error.message);
        if (error.message.includes('productos')) {
          errorMessage = "Error al guardar los productos del presupuesto";
        } else if (error.message.includes('column') || error.message.includes('does not exist')) {
          errorMessage = "Error de estructura de datos. Contacte al administrador.";
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
    }
  }, [isSaving, presupuestoId, presupuestoExistente, negocio, negocioId, crearPresupuesto, onCerrar]);

  return {
    negocio,
    presupuestoExistente,
    presupuestoId,
    guardarPresupuesto,
    isSaving
  };
};
