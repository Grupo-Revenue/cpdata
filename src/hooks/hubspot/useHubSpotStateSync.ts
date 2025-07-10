import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { EstadoNegocio } from '@/types';

export const useHubSpotStateSync = () => {
  const { toast } = useToast();

  const syncStateToHubSpot = useCallback(async (negocioId: string, estadoAnterior: EstadoNegocio, estadoNuevo: EstadoNegocio) => {
    try {
      logger.info(`[HubSpot State Sync] Starting state sync for negocio ${negocioId}: ${estadoAnterior} → ${estadoNuevo}`);

      // Get business data to verify HubSpot ID
      const { data: negocioData, error: negocioError } = await supabase
        .from('negocios')
        .select('user_id, hubspot_id')
        .eq('id', negocioId)
        .single();

      if (negocioError || !negocioData) {
        logger.warn(`[HubSpot State Sync] Business not found: ${negocioId}`);
        return;
      }

      // Check if business has HubSpot ID
      if (!negocioData.hubspot_id) {
        logger.warn(`[HubSpot State Sync] Business ${negocioId} has no HubSpot ID, skipping sync`);
        return;
      }

      // Validate API key exists
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('hubspot_api_keys')
        .select('activo')
        .eq('user_id', negocioData.user_id)
        .eq('activo', true)
        .single();

      if (apiKeyError || !apiKeyData) {
        logger.warn(`[HubSpot State Sync] No active HubSpot API key found for user`);
        return;
      }

      // Validate stage mapping exists
      const { data: stageMappingData, error: stageMappingError } = await supabase
        .from('hubspot_stage_mapping')
        .select('stage_id')
        .eq('user_id', negocioData.user_id)
        .eq('estado_negocio', estadoNuevo)
        .single();

      if (stageMappingError || !stageMappingData) {
        logger.warn(`[HubSpot State Sync] No stage mapping found for estado: ${estadoNuevo}`);
        return;
      }

      // Call the edge function to update HubSpot deal stage
      logger.info('[HubSpot State Sync] Calling hubspot-deal-update with:', {
        negocio_id: negocioId,
        estado_anterior: estadoAnterior,
        estado_nuevo: estadoNuevo
      });

      const { data: stateData, error: stateError } = await supabase.functions.invoke('hubspot-deal-update', {
        body: {
          negocio_id: negocioId,
          estado_anterior: estadoAnterior,
          estado_nuevo: estadoNuevo
        }
      });

      if (stateError) {
        logger.error(`[HubSpot State Sync] Error syncing state for negocio ${negocioId}:`, stateError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "Error al actualizar estado en HubSpot"
        });
        return;
      }

      logger.info(`[HubSpot State Sync] Successfully synced state for negocio ${negocioId}`);
      toast({
        title: "Sincronización exitosa",
        description: "Estado actualizado en HubSpot correctamente"
      });

    } catch (error) {
      logger.error(`[HubSpot State Sync] Unexpected error syncing negocio ${negocioId}:`, error);
      toast({
        variant: "destructive",
        title: "Error de sincronización",
        description: "Error inesperado al sincronizar con HubSpot"
      });
    }
  }, [toast]);

  return {
    syncStateToHubSpot
  };
};