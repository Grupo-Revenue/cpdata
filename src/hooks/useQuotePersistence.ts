
import { useNegocio } from '@/context/NegocioContext';
import { ProductoPresupuesto } from '@/types';
import { toast } from '@/hooks/use-toast';

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

    const presupuestoData = {
      nombre: `Presupuesto ${new Date().toLocaleDateString()}`,
      estado: 'borrador' as const,
      total,
      facturado: false,
      negocio_id: negocioId,
      fecha_envio: null,
      fecha_aprobacion: null,
      fecha_rechazo: null,
      fecha_vencimiento: null,
      fechaCreacion: new Date().toISOString(),
      fechaEnvio: undefined,
      fechaAprobacion: undefined,
      fechaRechazo: undefined,
      productos
    };

    try {
      if (presupuestoId) {
        console.log('Updating existing presupuesto:', presupuestoId);
        await actualizarPresupuesto(negocioId, presupuestoId, presupuestoData);
        toast({
          title: "Presupuesto actualizado",
          description: "El presupuesto ha sido actualizado exitosamente",
        });
      } else {
        console.log('Creating new presupuesto for negocio:', negocioId);
        await crearPresupuesto(negocioId, presupuestoData);
        toast({
          title: "Presupuesto creado",
          description: "El presupuesto y sus productos han sido guardados exitosamente",
        });
      }

      onCerrar();
    } catch (error) {
      console.error('Error saving presupuesto:', error);
      
      // Provide more specific error messages
      let errorMessage = "No se pudo guardar el presupuesto";
      if (error instanceof Error) {
        if (error.message.includes('productos')) {
          errorMessage = "Error al guardar los productos del presupuesto";
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
