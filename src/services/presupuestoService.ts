
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Enhanced logging for presupuesto service
const logPresupuestoAction = (action: string, presupuestoId: string, details?: any) => {
  console.log(`📋 [Presupuesto Service] ${action}:`, {
    presupuesto_id: presupuestoId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Function to trigger HubSpot amount sync with enhanced logging
const triggerHubSpotAmountSync = async (negocioId: string, trigger_source: string = 'presupuesto_change') => {
  try {
    console.log('💰 [Presupuesto Service] Triggering HubSpot amount sync:', {
      negocio_id: negocioId,
      trigger_source,
      timestamp: new Date().toISOString()
    });
    
    const { data, error } = await supabase.functions.invoke('hubspot-deal-amount-update', {
      body: { 
        negocio_id: negocioId,
        trigger_source
      }
    });

    if (error) {
      console.error('❌ [Presupuesto Service] Error syncing amount to HubSpot:', error);
      throw error;
    } else {
      console.log('✅ [Presupuesto Service] Amount sync triggered successfully:', data);
    }
  } catch (error) {
    console.error('❌ [Presupuesto Service] Unexpected error during amount sync:', error);
    throw error;
  }
};

export const cambiarEstadoPresupuesto = async (presupuestoId: string, nuevoEstado: string) => {
  try {
    logPresupuestoAction('CHANGING_STATE', presupuestoId, { 
      nuevo_estado: nuevoEstado,
      action: 'cambiarEstadoPresupuesto'
    });

    // Get current state and negocio_id first
    const { data: currentData, error: currentError } = await supabase
      .from('presupuestos')
      .select('estado, negocio_id, numero')
      .eq('id', presupuestoId)
      .single();

    if (currentError || !currentData) {
      throw new Error(`Error getting current presupuesto data: ${currentError?.message}`);
    }

    const estadoAnterior = currentData.estado;
    const negocioId = currentData.negocio_id;

    logPresupuestoAction('STATE_CHANGE_DETAILS', presupuestoId, {
      numero: currentData.numero,
      estado_anterior: estadoAnterior,
      estado_nuevo: nuevoEstado,
      negocio_id: negocioId
    });

    // Update the state
    const { data, error } = await supabase
      .from('presupuestos')
      .update({ estado: nuevoEstado })
      .eq('id', presupuestoId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Presupuesto Service] Error updating state:', error);
      throw error;
    }

    logPresupuestoAction('STATE_UPDATED', presupuestoId, {
      update_successful: true,
      new_data: data
    });

    // Check if the state change affects business value calculation
    const statesAffectingValue = ['aprobado', 'publicado', 'rechazado', 'borrador'];
    const shouldSyncAmount = statesAffectingValue.includes(estadoAnterior) || statesAffectingValue.includes(nuevoEstado);

    if (shouldSyncAmount) {
      console.log('🔄 [Presupuesto Service] State change affects business value, triggering HubSpot sync');
      await triggerHubSpotAmountSync(negocioId, 'presupuesto_state_change');
    } else {
      console.log('ℹ️ [Presupuesto Service] State change does not affect business value, skipping sync');
    }

    toast.success(`Presupuesto actualizado a ${nuevoEstado}`);
    return data;

  } catch (error) {
    console.error('❌ [Presupuesto Service] Error in cambiarEstadoPresupuesto:', error);
    toast.error('Error al cambiar estado del presupuesto');
    throw error;
  }
};

export const marcarComoFacturado = async (presupuestoId: string) => {
  try {
    logPresupuestoAction('MARKING_INVOICED', presupuestoId);

    // Get negocio_id first
    const { data: presupuestoData, error: presupuestoError } = await supabase
      .from('presupuestos')
      .select('negocio_id, numero, estado')
      .eq('id', presupuestoId)
      .single();

    if (presupuestoError || !presupuestoData) {
      throw new Error(`Error getting presupuesto data: ${presupuestoError?.message}`);
    }

    const { error } = await supabase.rpc('marcar_presupuesto_facturado', {
      presupuesto_id_param: presupuestoId
    });

    if (error) throw error;

    logPresupuestoAction('MARKED_INVOICED', presupuestoId, {
      numero: presupuestoData.numero,
      estado: presupuestoData.estado,
      negocio_id: presupuestoData.negocio_id
    });

    // Trigger HubSpot amount sync after marking as invoiced
    await triggerHubSpotAmountSync(presupuestoData.negocio_id, 'presupuesto_facturado');

    toast.success('Presupuesto marcado como facturado');
    
  } catch (error) {
    console.error('❌ [Presupuesto Service] Error marking as invoiced:', error);
    toast.error('Error al marcar como facturado');
    throw error;
  }
};
