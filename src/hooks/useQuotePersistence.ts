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

  const negocio = obtenerNegocio(negocioId);
  const presupuestoExistente = presupuestoId ? 
    negocio?.presupuestos.find(p => p.id === presupuestoId) : null;

  const guardarPresupuesto = async (productos: ProductoPresupuesto[]) => {
    if (productos.length === 0) {
      toast({
        title: "Sin productos",
        description: "Debe agregar al menos un producto al presupuesto",
        variant: "destructive"
      });
      return;
    }

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
        
        // For updates, we need to handle products separately
        const updateData = {
          nombre: presupuestoData.nombre,
          estado: presupuestoData.estado,
          total: presupuestoData.total,
          facturado: presupuestoData.facturado
        };
        
        await actualizarPresupuesto(negocioId, presupuestoId, updateData);
        toast({
          title: "Presupuesto actualizado",
          description: "El presupuesto ha sido actualizado exitosamente",
        });
      } else {
        console.log('Creating new presupuesto for negocio:', negocioId);
        await crearPresupuesto(negocioId, presupuestoData);
        toast({
          title: "Presupuesto creado",
          description: `El presupuesto ${quoteName} ha sido guardado exitosamente`,
        });
      }

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
    }
  };

  return {
    negocio,
    presupuestoExistente,
    presupuestoId,
    guardarPresupuesto
  };
};
