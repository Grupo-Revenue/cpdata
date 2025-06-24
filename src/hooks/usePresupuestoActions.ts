
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedBidirectionalSync } from './useEnhancedBidirectionalSync';

export const usePresupuestoActions = (negocioId: string, onRefresh: () => void) => {
  const { toast } = useToast();
  const { syncOnBudgetUpdate } = useEnhancedBidirectionalSync();
  const [loading, setLoading] = useState(false);

  const marcarComoFacturado = async (presupuestoId: string) => {
    if (!confirm('¿Está seguro de que desea marcar este presupuesto como facturado?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('Marking budget as invoiced and triggering state recalculation');
      
      const { error } = await supabase.rpc('marcar_presupuesto_facturado', {
        presupuesto_id_param: presupuestoId
      });

      if (error) {
        console.error('Error marking as invoiced:', error);
        throw error;
      }

      toast({
        title: "Presupuesto facturado",
        description: "El presupuesto se ha marcado como facturado y el estado del negocio se ha actualizado"
      });

      // Trigger HubSpot sync after state change
      setTimeout(async () => {
        await syncOnBudgetUpdate(negocioId);
      }, 1000);

      onRefresh();
    } catch (error) {
      console.error('Error marking as invoiced:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar el presupuesto como facturado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    marcarComoFacturado,
    loading
  };
};
