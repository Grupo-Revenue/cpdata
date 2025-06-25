
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
    if (!user) {
      console.log('[useFailedItemsRetry] No user available, cannot retry failed items');
      return;
    }

    try {
      console.log('[useFailedItemsRetry] Retrying failed items for user:', user.id);

      // First get the user's negocio IDs
      const { data: negociosData, error: negociosError } = await supabase
        .from('negocios')
        .select('id')
        .eq('user_id', user.id);

      if (negociosError) throw negociosError;

      const negocioIds = negociosData?.map(n => n.id) || [];
      console.log(`[useFailedItemsRetry] Found ${negocioIds.length} negocios for user`);

      if (negocioIds.length > 0) {
        // Reset failed items to pending status
        const { data: updatedItems, error } = await supabase
          .from('hubspot_sync_queue')
          .update({
            status: 'pending',
            scheduled_at: new Date().toISOString(),
            attempts: 0,
            error_message: null
          })
          .eq('status', 'failed')
          .in('negocio_id', negocioIds)
          .select('id');

        if (error) throw error;

        const retryCount = updatedItems?.length || 0;
        console.log(`[useFailedItemsRetry] Reset ${retryCount} failed items to pending`);

        if (retryCount > 0) {
          toast({
            title: "Elementos reintentados",
            description: `${retryCount} elementos fallidos han sido programados para reintento`
          });

          // Reload data and trigger processing
          await loadSyncData();
          setTimeout(() => {
            console.log('[useFailedItemsRetry] Triggering queue processing for retry');
            processQueue();
          }, 1000);
        } else {
          toast({
            title: "Sin elementos fallidos",
            description: "No hay elementos fallidos para reintentar"
          });
        }
      } else {
        toast({
          title: "Sin negocios",
          description: "No se encontraron negocios para procesar"
        });
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
