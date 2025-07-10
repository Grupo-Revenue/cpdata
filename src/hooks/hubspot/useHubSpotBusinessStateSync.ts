import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useHubSpotBusinessStateSync = () => {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const { toast } = useToast();

  // Simplified sync function
  const syncStateToHubSpot = useCallback(async (negocioData: any) => {
    try {
      logger.info(`[HubSpot Sync] Syncing negocio ${negocioData.id} - ${negocioData.estado_anterior} → ${negocioData.estado_nuevo}`);
      
      // Call the edge function to update HubSpot deal stage
      const { data: stateData, error: stateError } = await supabase.functions.invoke('hubspot-deal-update', {
        body: {
          negocio_id: negocioData.id,
          estado_anterior: negocioData.estado_anterior,
          estado_nuevo: negocioData.estado_nuevo,
          sync_log_id: negocioData.sync_log_id
        }
      });

      if (stateError) {
        logger.error(`[HubSpot Sync] Error syncing state for negocio ${negocioData.id}:`, stateError);
        return;
      }

      // Call the edge function to update HubSpot deal amount
      const { data: amountData, error: amountError } = await supabase.functions.invoke('hubspot-deal-amount-update', {
        body: {
          negocio_id: negocioData.id
        }
      });

      if (amountError) {
        logger.error(`[HubSpot Sync] Error syncing amount for negocio ${negocioData.id}:`, amountError);
      } else {
        logger.info(`[HubSpot Sync] Successfully synced state and amount for negocio ${negocioData.id}`);
      }

    } catch (error) {
      logger.error(`[HubSpot Sync] Unexpected error syncing negocio ${negocioData.id}:`, error);
      toast({
        variant: "destructive",
        title: "Error de sincronización",
        description: "Error al sincronizar con HubSpot"
      });
    }
  }, [toast]);

  // Simplified channel setup
  const setupChannel = useCallback(() => {
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    logger.info('[HubSpot Sync] Setting up real-time listener for business state changes');
    
    const channel = supabase
      .channel('hubspot-sync-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negocios',
          filter: 'estado=neq.null'
        },
        async (payload) => {
          const { new: newRecord, old: oldRecord } = payload;
          
          // Validate payload
          if (!newRecord?.id || !newRecord?.estado || !oldRecord?.estado) {
            logger.warn('[HubSpot Sync] Invalid payload, skipping', {
              newEstado: newRecord?.estado,
              oldEstado: oldRecord?.estado
            });
            return;
          }
          
          // Only sync if the state actually changed and it's not a manual update
          if (newRecord.estado !== oldRecord.estado) {
            logger.info('[HubSpot Sync] Business state changed', {
              negocio_id: newRecord.id,
              estado_anterior: oldRecord.estado,
              estado_nuevo: newRecord.estado,
              hubspot_id: newRecord.hubspot_id
            });

            // Create sync log entry
            try {
              const { data: logId } = await supabase.rpc('enqueue_hubspot_sync', {
                p_negocio_id: newRecord.id,
                p_operation_type: 'estado_change',
                p_payload: {
                  negocio_id: newRecord.id,
                  estado_anterior: oldRecord.estado,
                  estado_nuevo: newRecord.estado,
                  hubspot_id: newRecord.hubspot_id,
                  timestamp: Date.now()
                },
                p_priority: 3,
                p_trigger_source: 'realtime'
              });

              // Sync to HubSpot
              await syncStateToHubSpot({
                id: newRecord.id,
                estado_anterior: oldRecord.estado,
                estado_nuevo: newRecord.estado,
                hubspot_id: newRecord.hubspot_id,
                sync_log_id: logId
              });
            } catch (error) {
              logger.error('[HubSpot Sync] Error handling state change:', error);
            }
          }
        }
      )
      .subscribe((status) => {
        logger.info(`[HubSpot Sync] Channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          logger.info('[HubSpot Sync] Successfully subscribed to business state changes');
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          logger.error(`[HubSpot Sync] Subscription error: ${status}`);
          isSubscribedRef.current = false;
          
          // Only reconnect on non-CLOSED errors to prevent infinite loops
          if (status !== 'CLOSED') {
            // Simple reconnection after 5 seconds
            setTimeout(() => {
              if (!isSubscribedRef.current) {
                setupChannel();
              }
            }, 5000);
          }
        }
      });

    channelRef.current = channel;
  }, [syncStateToHubSpot]);

  useEffect(() => {
    // Prevent multiple subscriptions
    if (isSubscribedRef.current) {
      return;
    }

    logger.info('[HubSpot Sync] Initializing real-time listener for business state changes');
    setupChannel();

    // Cleanup subscription on unmount
    return () => {
      logger.info('[HubSpot Sync] Cleaning up subscription');
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      isSubscribedRef.current = false;
    };
  }, [setupChannel]);
};