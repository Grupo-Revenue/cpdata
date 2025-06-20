
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

  const guardarPresupuesto = (productos: ProductoPresupuesto[]) => {
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
    presupuestoExistente,
    presupuestoId,
    guardarPresupuesto
  };
};
