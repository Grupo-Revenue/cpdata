
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useHubSpotConfig } from './useHubSpotConfig';

interface SyncQueueItem {
  id: string;
  negocio_id: string;
  operation_type: string;
  priority: number;
  status: string;
  attempts: number;
  created_at: string;
  error_message?: string;
}

interface SyncStats {
  total_pending: number;
  total_processing: number;
  total_failed: number;
  total_completed_today: number;
  avg_processing_time_minutes: number;
}

export const useReactiveHubSpotSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config } = useHubSpotConfig();
  const channelRef = useRef<any>(null);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load sync queue and stats
  const loadSyncData = useCallback(async () => {
    if (!user) return;

    try {
      // First get the user's negocio IDs
      const { data: negociosData, error: negociosError } = await supabase
        .from('negocios')
        .select('id')
        .eq('user_id', user.id);

      if (negociosError) throw negociosError;

      const negocioIds = negociosData?.map(n => n.id) || [];

      if (negocioIds.length > 0) {
        // Load queue items for user's negocios
        const { data: queueData, error: queueError } = await supabase
          .from('hubspot_sync_queue')
          .select('*')
          .in('negocio_id', negocioIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (queueError) throw queueError;
        setSyncQueue(queueData || []);
      }

      // Load stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_hubspot_sync_stats');

      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setSyncStats(statsData[0]);
      }

    } catch (error) {
      console.error('[useReactiveHubSpotSync] Error loading sync data:', error);
    }
  }, [user]);

  // Process sync queue
  const processQueue = useCallback(async () => {
    if (!config?.api_key_set || !config?.auto_sync || isProcessing) return;

    setIsProcessing(true);
    try {
      console.log('[useReactiveHubSpotSync] Processing sync queue...');

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
        console.log(`[useReactiveHubSpotSync] Processing ${queueItems.length} queue items`);

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
              console.log(`[useReactiveHubSpotSync] Successfully processed queue item ${item.id}`);
            } else {
              console.error(`[useReactiveHubSpotSync] Failed to process queue item ${item.id}:`, data.error);
              
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
            console.error(`[useReactiveHubSpotSync] Error processing queue item ${item.id}:`, itemError);
            
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
      console.error('[useReactiveHubSpotSync] Error processing queue:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [config, user, isProcessing, loadSyncData]);

  // Listen to database notifications for real-time triggers
  useEffect(() => {
    if (!user || !config?.api_key_set) return;

    // Clean up existing channel first
    if (channelRef.current) {
      console.log('[useReactiveHubSpotSync] Cleaning up existing channel...');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('[useReactiveHubSpotSync] Setting up real-time sync listeners...');

    // Create a channel for listening to sync triggers
    const channel = supabase.channel('hubspot-sync-notifications');
    channelRef.current = channel;

    // Listen to PostgreSQL notifications
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'hubspot_sync_queue'
    }, (payload) => {
      console.log('[useReactiveHubSpotSync] Queue change detected:', payload);
      loadSyncData();
      
      // Process queue if new items were added
      if (payload.eventType === 'INSERT') {
        setTimeout(() => processQueue(), 1000);
      }
    }).subscribe((status) => {
      console.log(`[useReactiveHubSpotSync] Channel subscription status: ${status}`);
    });

    return () => {
      console.log('[useReactiveHubSpotSync] Cleaning up sync listeners...');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, config?.api_key_set]); // Simplified dependencies

  // Periodic queue processing
  useEffect(() => {
    if (!config?.auto_sync || !config?.api_key_set) return;

    const interval = setInterval(() => {
      processQueue();
    }, 30000); // Process every 30 seconds

    return () => clearInterval(interval);
  }, [config?.auto_sync, config?.api_key_set, processQueue]);

  // Initial data load
  useEffect(() => {
    loadSyncData();
  }, [loadSyncData]);

  // Manual sync trigger for specific negocio
  const triggerSync = useCallback(async (negocioId: string, operation: string = 'update', priority: number = 5) => {
    if (!user) return;

    try {
      console.log(`[useReactiveHubSpotSync] Manually triggering sync for negocio ${negocioId}`);

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

      console.log(`[useReactiveHubSpotSync] Sync queued with ID: ${queueId}`);
      
      toast({
        title: "Sincronización programada",
        description: "La sincronización con HubSpot ha sido programada y se procesará en breve"
      });

      // Trigger immediate processing
      setTimeout(() => processQueue(), 500);

      return queueId;

    } catch (error) {
      console.error('[useReactiveHubSpotSync] Error triggering sync:', error);
      toast({
        title: "Error",
        description: "No se pudo programar la sincronización",
        variant: "destructive"
      });
    }
  }, [user, toast, processQueue]);

  // Retry failed items
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
      console.error('[useReactiveHubSpotSync] Error retrying failed items:', error);
      toast({
        title: "Error",
        description: "No se pudieron reintentar los elementos fallidos",
        variant: "destructive"
      });
    }
  }, [user, toast, loadSyncData, processQueue]);

  return {
    syncQueue,
    syncStats,
    isProcessing,
    triggerSync,
    retryFailedItems,
    loadSyncData,
    processQueue
  };
};
