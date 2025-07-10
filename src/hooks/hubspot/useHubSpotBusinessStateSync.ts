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

      // Validate stage mapping exists (búsqueda global)
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
      logger.info('[HubSpot Sync] Calling hubspot-deal-update with:', {
        negocio_id: negocioData.id,
        estado_anterior: negocioData.estado_anterior,
        estado_nuevo: negocioData.estado_nuevo,
        sync_log_id: negocioData.sync_log_id
      });

      const { data: stateData, error: stateError } = await supabase.functions.invoke('hubspot-deal-update', {
        body: {
          negocio_id: negocioData.id,
          estado_anterior: negocioData.estado_anterior,
          estado_nuevo: negocioData.estado_nuevo,
          sync_log_id: negocioData.sync_log_id
        }
      });

      logger.info('[HubSpot Sync] hubspot-deal-update response:', { data: stateData, error: stateError });

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

  // Disabled automatic real-time sync due to connection issues
  // Manual sync only through button
  const setupChannel = useCallback(() => {
    logger.info('[HubSpot Sync] Real-time sync disabled - using manual sync only');
  }, []);

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