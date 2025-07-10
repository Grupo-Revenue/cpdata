import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useManualHubSpotSync = () => {
  const { toast } = useToast();

  const syncNegocioToHubSpot = useCallback(async (negocioId: string) => {
    try {
      logger.info(`[Manual HubSpot Sync] Starting manual sync for negocio: ${negocioId}`);

      // Get the current negocio data
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .select('*')
        .eq('id', negocioId)
        .single();

      if (negocioError || !negocio) {
        logger.error('[Manual HubSpot Sync] Failed to fetch negocio:', negocioError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo obtener la información del negocio"
        });
        return;
      }

      if (!negocio.hubspot_id) {
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: "Este negocio no tiene HubSpot ID asociado"
        });
        return;
      }

      // Check if API key exists
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('hubspot_api_keys')
        .select('activo')
        .eq('activo', true)
        .single();

      if (apiKeyError || !apiKeyData) {
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: "No se encontró una API key activa de HubSpot"
        });
        return;
      }

      // Check if stage mapping exists
      const { data: stageMappingData, error: stageMappingError } = await supabase
        .from('hubspot_stage_mapping')
        .select('stage_id')
        .eq('estado_negocio', negocio.estado)
        .single();

      if (stageMappingError || !stageMappingData) {
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: `No se encontró mapeo de etapa para el estado: ${negocio.estado}`
        });
        return;
      }

      // Create sync log entry
      const { data: logId, error: rpcError } = await supabase.rpc('enqueue_hubspot_sync', {
        p_negocio_id: negocio.id,
        p_operation_type: 'manual_sync',
        p_payload: {
          negocio_id: negocio.id,
          estado_nuevo: negocio.estado,
          hubspot_id: negocio.hubspot_id,
          timestamp: Date.now()
        },
        p_priority: 1, // High priority for manual sync
        p_trigger_source: 'manual'
      });

      if (rpcError) {
        logger.error('[Manual HubSpot Sync] Error creating sync log entry:', rpcError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al crear registro de sincronización"
        });
        return;
      }

      // Call the edge function to update HubSpot deal stage
      logger.info('[Manual HubSpot Sync] Calling hubspot-deal-update with:', {
        negocio_id: negocio.id,
        estado_anterior: negocio.estado, // For manual sync, we use current state as both anterior and nuevo
        estado_nuevo: negocio.estado,
        sync_log_id: logId
      });

      const { data: stateData, error: stateError } = await supabase.functions.invoke('hubspot-deal-update', {
        body: {
          negocio_id: negocio.id,
          estado_anterior: negocio.estado,
          estado_nuevo: negocio.estado,
          sync_log_id: logId
        }
      });

      logger.info('[Manual HubSpot Sync] hubspot-deal-update response:', { data: stateData, error: stateError });

      if (stateError) {
        logger.error(`[Manual HubSpot Sync] Error syncing state:`, stateError);
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
          negocio_id: negocio.id
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (amountError) {
        logger.error(`[Manual HubSpot Sync] Error syncing amount:`, amountError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "Error al actualizar monto en HubSpot"
        });
      } else {
        logger.info(`[Manual HubSpot Sync] Successfully synced negocio ${negocio.id}`);
        toast({
          title: "Sincronización exitosa",
          description: "Estado actualizado manualmente en HubSpot"
        });
      }

    } catch (error) {
      logger.error(`[Manual HubSpot Sync] Unexpected error:`, error);
      toast({
        variant: "destructive",
        title: "Error de sincronización",
        description: "Error inesperado al sincronizar con HubSpot"
      });
    }
  }, [toast]);

  return { syncNegocioToHubSpot };
};