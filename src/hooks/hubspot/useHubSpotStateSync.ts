import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { EstadoNegocio } from '@/types';

export const useHubSpotStateSync = () => {
  const { toast } = useToast();

  const syncStateToHubSpot = useCallback(async (negocioId: string, estadoAnterior: EstadoNegocio, estadoNuevo: EstadoNegocio) => {
    try {
      console.log(`[HubSpot State Sync] Starting state sync for negocio ${negocioId}: ${estadoAnterior} → ${estadoNuevo}`);

      // Get business data to verify HubSpot ID
      const { data: negocioData, error: negocioError } = await supabase
        .from('negocios')
        .select('user_id, hubspot_id')
        .eq('id', negocioId)
        .single();

      if (negocioError || !negocioData) {
        console.warn(`[HubSpot State Sync] Business not found: ${negocioId}`, negocioError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "Negocio no encontrado"
        });
        return;
      }

      // Check if business has HubSpot ID
      if (!negocioData.hubspot_id) {
        console.warn(`[HubSpot State Sync] Business ${negocioId} has no HubSpot ID, skipping sync`);
        toast({
          variant: "destructive",
          title: "Sincronización omitida",
          description: "Este negocio no está conectado con HubSpot"
        });
        return;
      }

      console.log(`[HubSpot State Sync] Checking API key for user: ${negocioData.user_id}`);

      // Validate API key exists
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('hubspot_api_keys')
        .select('api_key, activo')
        .eq('user_id', negocioData.user_id)
        .eq('activo', true)
        .maybeSingle();

      console.log(`[HubSpot State Sync] API key check result:`, { apiKeyData: !!apiKeyData, apiKeyError });

      if (apiKeyError) {
        console.error(`[HubSpot State Sync] Error checking API key:`, apiKeyError);
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: "Error al verificar la clave de HubSpot"
        });
        return;
      }

      if (!apiKeyData) {
        console.warn(`[HubSpot State Sync] No active HubSpot API key found for user ${negocioData.user_id}`);
        toast({
          variant: "destructive",
          title: "Configuración incompleta",
          description: "No hay una clave de HubSpot activa configurada"
        });
        return;
      }

      console.log(`[HubSpot State Sync] Checking stage mapping for estado: ${estadoNuevo}`);

      // Validate stage mapping exists
      const { data: stageMappingData, error: stageMappingError } = await supabase
        .from('hubspot_stage_mapping')
        .select('stage_id')
        .eq('user_id', negocioData.user_id)
        .eq('estado_negocio', estadoNuevo)
        .maybeSingle();

      console.log(`[HubSpot State Sync] Stage mapping check result:`, { stageMappingData, stageMappingError });

      if (stageMappingError) {
        console.error(`[HubSpot State Sync] Error checking stage mapping:`, stageMappingError);
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: "Error al verificar el mapeo de estados"
        });
        return;
      }

      if (!stageMappingData) {
        console.warn(`[HubSpot State Sync] No stage mapping found for estado: ${estadoNuevo}`);
        toast({
          variant: "destructive",
          title: "Configuración incompleta",
          description: `No hay mapeo configurado para el estado: ${estadoNuevo}`
        });
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