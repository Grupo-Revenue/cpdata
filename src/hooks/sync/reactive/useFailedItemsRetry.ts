
import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useFailedItemsRetry = (
  loadSyncData: () => Promise<void>,
  processQueue: () => Promise<void>
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const retryFailedItems = useCallback(async () => {
    try {
      // First get the user's negocio IDs
      const { data: negociosData, error: negociosError } = await supabase
        .from('negocios')
        .select('id')
        .eq('user_id', user.id);

      if (negociosError) throw negociosError;

      const negocioIds = negociosData?.map(n => n.id) || [];

      if (negocioIds.length > 0) {
        const { error } = await supabase
          .from('hubspot_sync_queue')
          .update({
            status: 'pending',
            scheduled_at: new Date().toISOString(),
            attempts: 0,
            error_message: null
          })
          .eq('status', 'failed')
          .in('negocio_id', negocioIds);

        if (error) throw error;

        toast({
          title: "Elementos reintentados",
          description: "Los elementos fallidos han sido programados para reintento"
        });

        await loadSyncData();
        setTimeout(() => processQueue(), 1000);
      }

    } catch (error) {
      console.error('[useFailedItemsRetry] Error retrying failed items:', error);
      toast({
        title: "Error",
        description: "No se pudieron reintentar los elementos fallidos",
        variant: "destructive"
      });
    }
  }, [user, toast, loadSyncData, processQueue]);

  return { retryFailedItems };
};
