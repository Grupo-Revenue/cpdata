import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useHubSpotBusinessStateSync = () => {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const { toast } = useToast();

  // Maximum number of retry attempts
  const MAX_RETRIES = 5;
  // Base delay for exponential backoff (in milliseconds)
  const BASE_RETRY_DELAY = 1000;

  // Exponential backoff calculation
  const getRetryDelay = useCallback((retryCount: number) => {
    return BASE_RETRY_DELAY * Math.pow(2, retryCount);
  }, []);

  // Enhanced sync function with retry logic
  const syncStateToHubSpot = useCallback(async (negocioData: any, retryCount = 0) => {
    const startTime = Date.now();
    
    try {
      logger.info(`[HubSpot Sync] Attempting sync for negocio ${negocioData.id} (attempt ${retryCount + 1})`);
      
      // Call the edge function to update HubSpot
      const { data, error } = await supabase.functions.invoke('hubspot-deal-update', {
        body: {
          negocio_id: negocioData.id,
          estado_anterior: negocioData.estado_anterior,
          estado_nuevo: negocioData.estado_nuevo,
          sync_log_id: negocioData.sync_log_id
        }
      });

      const executionTime = Date.now() - startTime;

      if (error) {
        throw new Error(`HubSpot API Error: ${error.message}`);
      }

      logger.info(`[HubSpot Sync] Successfully synced state to HubSpot in ${executionTime}ms`, data);
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      return { success: true, data, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`[HubSpot Sync] Error syncing state to HubSpot (attempt ${retryCount + 1})`, error);

      // If we haven't exceeded max retries, schedule a retry
      if (retryCount < MAX_RETRIES) {
        const retryDelay = getRetryDelay(retryCount);
        logger.info(`[HubSpot Sync] Scheduling retry in ${retryDelay}ms`);
        
        setTimeout(() => {
          syncStateToHubSpot(negocioData, retryCount + 1);
        }, retryDelay);
      } else {
        logger.error(`[HubSpot Sync] Max retries (${MAX_RETRIES}) exceeded for negocio ${negocioData.id}`);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: `No se pudo sincronizar el estado del negocio con HubSpot después de ${MAX_RETRIES} intentos`
        });
      }

      return { success: false, error, executionTime };
    }
  }, [getRetryDelay, toast]);

  // Enhanced channel setup with auto-reconnection
  const setupChannel = useCallback(() => {
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    logger.info(`[HubSpot Sync] Setting up channel (attempt ${retryCountRef.current + 1})`);
    
    // Create optimized channel configuration
    const channelName = `hubspot-sync-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negocios',
          filter: 'estado=neq.null'
        },
        async (payload) => {
          logger.debug('[HubSpot Sync] Real-time payload received', payload);
          
          const { new: newRecord, old: oldRecord } = payload;
          
          // Enhanced validation
          if (!newRecord?.id || !newRecord?.estado || !oldRecord?.estado) {
            logger.warn('[HubSpot Sync] Invalid payload data, skipping', {
              hasNewRecord: !!newRecord,
              hasOldRecord: !!oldRecord,
              newEstado: newRecord?.estado,
              oldEstado: oldRecord?.estado
            });
            return;
          }
          
          // Only sync if the state actually changed
          if (newRecord.estado !== oldRecord.estado) {
            logger.info('[HubSpot Sync] Business state changed', {
              negocio_id: newRecord.id,
              estado_anterior: oldRecord.estado,
              estado_nuevo: newRecord.estado,
              hubspot_id: newRecord.hubspot_id
            });

            // Create sync log entry first
            try {
              const { data: logData } = await supabase.rpc('enqueue_hubspot_sync', {
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

              // Sync to HubSpot with the log ID
              await syncStateToHubSpot({
                id: newRecord.id,
                estado_anterior: oldRecord.estado,
                estado_nuevo: newRecord.estado,
                hubspot_id: newRecord.hubspot_id,
                sync_log_id: logData
              });
            } catch (error) {
              logger.error('[HubSpot Sync] Error handling state change', error);
            }
          } else {
            logger.debug('[HubSpot Sync] State unchanged, skipping sync');
          }
        }
      )
      .subscribe((status) => {
        logger.info(`[HubSpot Sync] Channel status: ${status}`);
        
        switch (status) {
          case 'SUBSCRIBED':
            logger.info('[HubSpot Sync] Successfully subscribed to business state changes');
            isSubscribedRef.current = true;
            retryCountRef.current = 0; // Reset retry count on successful connection
            break;
            
          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
          case 'CLOSED':
            logger.error(`[HubSpot Sync] Subscription error: ${status}`);
            isSubscribedRef.current = false;
            
            // Auto-reconnect with exponential backoff
            if (retryCountRef.current < MAX_RETRIES) {
              const retryDelay = getRetryDelay(retryCountRef.current);
              logger.info(`[HubSpot Sync] Scheduling reconnection in ${retryDelay}ms`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                retryCountRef.current++;
                setupChannel();
              }, retryDelay);
            } else {
              logger.error(`[HubSpot Sync] Max reconnection attempts exceeded`);
              toast({
                variant: "destructive",
                title: "Error de conexión",
                description: "No se pudo establecer conexión con el sistema de sincronización"
              });
            }
            break;
        }
      });

    channelRef.current = channel;
  }, [syncStateToHubSpot, getRetryDelay, toast]);

  useEffect(() => {
    // Prevent multiple subscriptions
    if (isSubscribedRef.current) {
      logger.debug('[HubSpot Sync] Already subscribed, skipping');
      return;
    }

    logger.info('[HubSpot Sync] Initializing enhanced real-time listener for business state changes');
    setupChannel();

    // Cleanup subscription on unmount
    return () => {
      logger.info('[HubSpot Sync] Cleaning up subscription');
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      isSubscribedRef.current = false;
      retryCountRef.current = 0;
    };
  }, [setupChannel]);
};