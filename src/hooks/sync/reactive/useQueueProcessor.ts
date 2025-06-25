
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { supabase } from '@/integrations/supabase/client';

export const useQueueProcessor = (loadSyncData: () => Promise<void>) => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const [isProcessing, setIsProcessing] = useState(false);

  const processQueue = useCallback(async () => {
    if (!config?.api_key_set || !config?.auto_sync || isProcessing) return;

    setIsProcessing(true);
    try {
      console.log('[useQueueProcessor] Processing sync queue...');

      // Get pending queue items
      const { data: queueItems, error } = await supabase
        .from('hubspot_sync_queue')
        .select(`
          *,
          negocios!inner(user_id)
        `)
        .eq('negocios.user_id', user.id)
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) throw error;

      if (queueItems && queueItems.length > 0) {
        console.log(`[useQueueProcessor] Processing ${queueItems.length} queue items`);

        for (const item of queueItems) {
          try {
            // Update status to processing
            await supabase
              .from('hubspot_sync_queue')
              .update({ 
                status: 'processing',
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id);

            // Call the edge function to process the sync
            const { data, error: syncError } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
              body: {
                queueItemId: item.id,
                negocioId: item.negocio_id,
                operation: item.operation_type,
                payload: item.payload
              }
            });

            if (syncError) throw syncError;

            // Update queue item status based on result
            await supabase
              .from('hubspot_sync_queue')
              .update({
                status: data.success ? 'completed' : 'failed',
                processed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                error_message: data.success ? null : data.error,
                attempts: item.attempts + 1
              })
              .eq('id', item.id);

            if (data.success) {
              console.log(`[useQueueProcessor] Successfully processed queue item ${item.id}`);
            } else {
              console.error(`[useQueueProcessor] Failed to process queue item ${item.id}:`, data.error);
              
              // Schedule retry if under max attempts
              if (item.attempts < 2) { // max 3 attempts total
                const retryDelay = Math.pow(2, item.attempts) * 5; // exponential backoff: 5, 10, 20 minutes
                await supabase
                  .from('hubspot_sync_queue')
                  .update({
                    status: 'pending',
                    scheduled_at: new Date(Date.now() + retryDelay * 60000).toISOString()
                  })
                  .eq('id', item.id);
              }
            }

          } catch (itemError) {
            console.error(`[useQueueProcessor] Error processing queue item ${item.id}:`, itemError);
            
            // Mark as failed
            await supabase
              .from('hubspot_sync_queue')
              .update({
                status: 'failed',
                updated_at: new Date().toISOString(),
                error_message: itemError.message,
                attempts: item.attempts + 1
              })
              .eq('id', item.id);
          }
        }

        // Reload data after processing
        await loadSyncData();
      }

    } catch (error) {
      console.error('[useQueueProcessor] Error processing queue:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [config, user, isProcessing, loadSyncData]);

  return {
    isProcessing,
    processQueue
  };
};
