import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useHubSpotBusinessStateSync = () => {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const { toast } = useToast();

  // Enhanced sync function with validation and notifications
  const syncStateToHubSpot = useCallback(async (negocioData: any) => {
    try {
      logger.info(`[HubSpot Sync] Starting sync for negocio ${negocioData.id} - ${negocioData.estado_anterior} → ${negocioData.estado_nuevo}`);
      
      // Validate required data before attempting sync
      if (!negocioData.hubspot_id) {
        logger.warn(`[HubSpot Sync] Negocio ${negocioData.id} has no HubSpot ID, skipping sync`);
        return;
      }

      // Validate API key exists
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('hubspot_api_keys')
        .select('activo')
        .eq('activo', true)
        .single();

      if (apiKeyError || !apiKeyData) {
        logger.warn(`[HubSpot Sync] No active HubSpot API key found, skipping sync`);
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: "No se encontró una API key activa de HubSpot"
        });
        return;
      }

      // Validate stage mapping exists
      const { data: stageMappingData, error: stageMappingError } = await supabase
        .from('hubspot_stage_mapping')
        .select('stage_id')
        .eq('estado_negocio', negocioData.estado_nuevo)
        .single();

      if (stageMappingError || !stageMappingData) {
        logger.warn(`[HubSpot Sync] No stage mapping found for estado: ${negocioData.estado_nuevo}`);
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: `No se encontró mapeo de etapa para el estado: ${negocioData.estado_nuevo}`
        });
        return;
      }

      // Call the edge function to update HubSpot deal stage with proper headers
      const { data: stateData, error: stateError } = await supabase.functions.invoke('hubspot-deal-update', {
        body: {
          negocio_id: negocioData.id,
          estado_anterior: negocioData.estado_anterior,
          estado_nuevo: negocioData.estado_nuevo,
          sync_log_id: negocioData.sync_log_id
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (stateError) {
        logger.error(`[HubSpot Sync] Error syncing state for negocio ${negocioData.id}:`, stateError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "Error al actualizar estado en HubSpot"
        });
        return;
      }

      // Call the edge function to update HubSpot deal amount
      const { data: amountData, error: amountError } = await supabase.functions.invoke('hubspot-deal-amount-update', {
        body: {
          negocio_id: negocioData.id
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (amountError) {
        logger.error(`[HubSpot Sync] Error syncing amount for negocio ${negocioData.id}:`, amountError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "Error al actualizar monto en HubSpot"
        });
      } else {
        logger.info(`[HubSpot Sync] Successfully synced state and amount for negocio ${negocioData.id}`);
        toast({
          title: "Sincronización exitosa",
          description: "Estado actualizado en HubSpot correctamente"
        });
      }

    } catch (error) {
      logger.error(`[HubSpot Sync] Unexpected error syncing negocio ${negocioData.id}:`, error);
      toast({
        variant: "destructive",
        title: "Error de sincronización",
        description: "Error inesperado al sincronizar con HubSpot"
      });
    }
  }, [toast]);

  // Enhanced channel setup with improved stability and logging
  const setupChannel = useCallback(() => {
    // Clean up existing channel
    if (channelRef.current) {
      logger.info('[HubSpot Sync] Cleaning up existing channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    logger.info('[HubSpot Sync] Setting up enhanced real-time listener for business state changes');
    
    const channel = supabase
      .channel('hubspot-sync-channel', {
        config: {
          broadcast: { self: false },
          presence: { key: 'hubspot-sync' }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negocios',
          filter: 'estado=neq.null'
        },
        async (payload) => {
          logger.info('[HubSpot Sync] Received real-time update:', payload);
          const { new: newRecord, old: oldRecord } = payload;
          
          // Enhanced payload validation
          if (!newRecord?.id || !newRecord?.estado || !oldRecord?.estado) {
            logger.warn('[HubSpot Sync] Invalid payload, skipping sync', {
              hasNewRecord: !!newRecord,
              hasId: !!newRecord?.id,
              newEstado: newRecord?.estado,
              oldEstado: oldRecord?.estado,
              fullPayload: payload
            });
            return;
          }
          
          // Only sync if the state actually changed
          if (newRecord.estado !== oldRecord.estado) {
            logger.info('[HubSpot Sync] Detected business state change, initiating sync', {
              negocio_id: newRecord.id,
              estado_anterior: oldRecord.estado,
              estado_nuevo: newRecord.estado,
              hubspot_id: newRecord.hubspot_id,
              has_hubspot_id: !!newRecord.hubspot_id
            });

            // Create sync log entry and sync to HubSpot
            try {
              const { data: logId, error: rpcError } = await supabase.rpc('enqueue_hubspot_sync', {
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

              if (rpcError) {
                logger.error('[HubSpot Sync] Error creating sync log entry:', rpcError);
                return;
              }

              logger.info(`[HubSpot Sync] Created sync log entry with ID: ${logId}`);

              // Sync to HubSpot immediately
              await syncStateToHubSpot({
                id: newRecord.id,
                estado_anterior: oldRecord.estado,
                estado_nuevo: newRecord.estado,
                hubspot_id: newRecord.hubspot_id,
                sync_log_id: logId
              });
            } catch (error) {
              logger.error('[HubSpot Sync] Error in real-time handler:', error);
            }
          } else {
            logger.debug('[HubSpot Sync] State unchanged, skipping sync', {
              negocio_id: newRecord.id,
              estado: newRecord.estado
            });
          }
        }
      )
      .subscribe((status) => {
        logger.info(`[HubSpot Sync] Channel subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          logger.info('[HubSpot Sync] ✅ Successfully subscribed to business state changes');
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('[HubSpot Sync] ❌ Channel error occurred');
          isSubscribedRef.current = false;
          // Retry connection after 3 seconds
          setTimeout(() => {
            if (!isSubscribedRef.current) {
              logger.info('[HubSpot Sync] Attempting to reconnect after channel error...');
              setupChannel();
            }
          }, 3000);
        } else if (status === 'TIMED_OUT') {
          logger.error('[HubSpot Sync] ⏰ Channel subscription timed out');
          isSubscribedRef.current = false;
          // Retry connection after 5 seconds
          setTimeout(() => {
            if (!isSubscribedRef.current) {
              logger.info('[HubSpot Sync] Attempting to reconnect after timeout...');
              setupChannel();
            }
          }, 5000);
        } else if (status === 'CLOSED') {
          logger.warn('[HubSpot Sync] 🔒 Channel closed');
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;
    logger.info('[HubSpot Sync] Channel setup completed');
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