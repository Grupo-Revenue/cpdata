
import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useSyncTrigger = (processQueue: () => Promise<void>) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const triggerSync = useCallback(async (negocioId: string, operation: string = 'update', priority: number = 5) => {
    if (!user) return;

    try {
      console.log(`[useSyncTrigger] Manually triggering sync for negocio ${negocioId}`);

      // Get negocio data
      const { data: negocio, error } = await supabase
        .from('negocios')
        .select(`
          *,
          presupuestos(*)
        `)
        .eq('id', negocioId)
        .single();

      if (error) throw error;

      // Enqueue sync operation
      const { data: queueId, error: enqueueError } = await supabase
        .rpc('enqueue_hubspot_sync', {
          p_negocio_id: negocioId,
          p_operation_type: operation,
          p_payload: {
            negocio: negocio,
            trigger_source: 'manual',
            timestamp: new Date().toISOString()
          },
          p_priority: priority
        });

      if (enqueueError) throw enqueueError;

      console.log(`[useSyncTrigger] Sync queued with ID: ${queueId}`);
      
      toast({
        title: "Sincronización programada",
        description: "La sincronización con HubSpot ha sido programada y se procesará en breve"
      });

      // Trigger immediate processing
      setTimeout(() => processQueue(), 500);

      return queueId;

    } catch (error) {
      console.error('[useSyncTrigger] Error triggering sync:', error);
      toast({
        title: "Error",
        description: "No se pudo programar la sincronización",
        variant: "destructive"
      });
    }
  }, [user, toast, processQueue]);

  return { triggerSync };
};
