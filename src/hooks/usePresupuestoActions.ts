import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Function to trigger HubSpot amount sync
const triggerHubSpotAmountSync = async (negocioId: string) => {
  try {
    console.log('💰 [Presupuesto Actions] Triggering HubSpot amount sync for negocio:', negocioId);
    
    const { error } = await supabase.functions.invoke('hubspot-deal-amount-update', {
      body: { 
        negocio_id: negocioId,
        trigger_source: 'presupuesto_facturado'
      }
    });

    if (error) {
      console.error('❌ [Presupuesto Actions] Error syncing amount to HubSpot:', error);
    } else {
      console.log('✅ [Presupuesto Actions] Amount sync triggered successfully');
    }
  } catch (error) {
    console.error('❌ [Presupuesto Actions] Unexpected error during amount sync:', error);
  }
};

export const usePresupuestoActions = (negocioId: string, onRefresh: () => void) => {
  const [loading, setLoading] = useState(false);

  const marcarComoFacturado = async (presupuestoId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('marcar_presupuesto_facturado', {
        presupuesto_id_param: presupuestoId
      });

      if (error) throw error;

      toast.success('Presupuesto marcado como facturado');
      
      // Trigger HubSpot amount sync after marking as invoiced
      await triggerHubSpotAmountSync(negocioId);
      
      onRefresh();
    } catch (error) {
      console.error('Error al marcar presupuesto como facturado:', error);
      toast.error('Error al marcar como facturado');
    } finally {
      setLoading(false);
    }
  };

  return {
    marcarComoFacturado,
    loading
  };
};