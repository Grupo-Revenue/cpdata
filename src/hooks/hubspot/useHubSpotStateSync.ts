import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { EstadoNegocio } from '@/types';

export const useHubSpotStateSync = () => {
  const { toast } = useToast();

  const syncStateToHubSpot = useCallback(async (negocioId: string, estadoAnterior: EstadoNegocio, estadoNuevo: EstadoNegocio) => {
    try {
      console.log(`[HubSpot State Sync] Syncing ${negocioId}: ${estadoAnterior} → ${estadoNuevo}`);

      // Get business data first
      const { data: negocioData, error: negocioError } = await supabase
        .from('negocios')
        .select('user_id, hubspot_id')
        .eq('id', negocioId)
        .single();

      if (negocioError || !negocioData || !negocioData.hubspot_id) {
        console.log('[HubSpot State Sync] Skipping - missing data or HubSpot ID');
        return;
      }

      // Get API key
      const { data: apiKeyData } = await supabase
        .from('hubspot_api_keys')
        .select('api_key')
        .eq('user_id', negocioData.user_id)
        .eq('activo', true)
        .single();

      // Get stage mapping
      const { data: stageMappingData } = await supabase
        .from('hubspot_stage_mapping')
        .select('stage_id')
        .eq('user_id', negocioData.user_id)
        .eq('estado_negocio', estadoNuevo)
        .single();

      if (!apiKeyData?.api_key || !stageMappingData?.stage_id) {
        console.log('[HubSpot State Sync] Skipping - missing API key or stage mapping');
        return;
      }

      console.log(`[HubSpot State Sync] Updating deal ${negocioData.hubspot_id} to stage ${stageMappingData.stage_id}`);

      // Direct HubSpot API call
      const response = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${negocioData.hubspot_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKeyData.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            dealstage: stageMappingData.stage_id
          }
        })
      });

      if (response.ok) {
        console.log('[HubSpot State Sync] ✅ Deal stage updated successfully');
        toast({
          title: "Estado sincronizado",
          description: "Estado actualizado en HubSpot correctamente"
        });
      } else {
        const errorText = await response.text();
        console.error('[HubSpot State Sync] ❌ HubSpot API error:', errorText);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "Error al actualizar estado en HubSpot"
        });
      }

    } catch (error) {
      console.error('[HubSpot State Sync] ❌ Unexpected error:', error);
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