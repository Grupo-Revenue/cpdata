
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EstadoNegocio } from '@/types';

export const useHubSpotStateSync = () => {
  const { toast } = useToast();

  const syncStateToHubSpot = useCallback(async (negocioId: string, estadoAnterior: EstadoNegocio, estadoNuevo: EstadoNegocio) => {
    console.log(`🔄 [HubSpot State Sync] STARTING sync for ${negocioId}: ${estadoAnterior} → ${estadoNuevo}`);
    console.log('🔄 [HubSpot State Sync] Function called at:', new Date().toISOString());
    
    try {
      // Step 1: Verify business exists and has HubSpot ID
      console.log('📊 [HubSpot State Sync] Step 1: Getting business data...');
      const { data: negocioData, error: negocioError } = await supabase
        .from('negocios')
        .select('user_id, hubspot_id')
        .eq('id', negocioId)
        .single();

      console.log('📊 [HubSpot State Sync] Business data result:', { negocioData, negocioError });

      if (negocioError) {
        console.error('❌ [HubSpot State Sync] Error getting business data:', negocioError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "No se pudo obtener datos del negocio"
        });
        return;
      }

      if (!negocioData?.hubspot_id) {
        console.log('⚠️ [HubSpot State Sync] Business has no HubSpot ID, skipping sync');
        return;
      }

      // Step 2: Check if we have an active global HubSpot API key
      console.log('🔑 [HubSpot State Sync] Step 2: Checking for active HubSpot API key...');
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('hubspot_api_keys')
        .select('activo')
        .eq('activo', true)
        .maybeSingle();

      console.log('🔑 [HubSpot State Sync] API key check result:', { hasApiKey: !!apiKeyData, error: apiKeyError });

      if (apiKeyError || !apiKeyData) {
        console.warn(`[HubSpot State Sync] No active HubSpot API key found`);
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: "No se encontró una API key activa de HubSpot"
        });
        return;
      }

      // Step 3: Check if we have stage mapping for this state
      console.log('🎯 [HubSpot State Sync] Step 3: Checking stage mapping...');
      const { data: stageMappingData, error: stageMappingError } = await supabase
        .from('hubspot_stage_mapping')
        .select('stage_id')
        .eq('estado_negocio', estadoNuevo)
        .maybeSingle();

      console.log('🎯 [HubSpot State Sync] Stage mapping result:', { hasMapping: !!stageMappingData, error: stageMappingError });

      if (stageMappingError || !stageMappingData) {
        console.warn(`[HubSpot State Sync] No stage mapping found for estado: ${estadoNuevo}`);
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: `No se encontró mapeo de etapa para el estado: ${estadoNuevo}`
        });
        return;
      }

      // Step 4: Call the edge function to update HubSpot deal stage
      console.log('🚀 [HubSpot State Sync] Step 4: Calling edge function...');
      const { data: syncData, error: syncError } = await supabase.functions.invoke('hubspot-deal-update', {
        body: {
          negocio_id: negocioId,
          estado_anterior: estadoAnterior,
          estado_nuevo: estadoNuevo
        }
      });

      console.log('🚀 [HubSpot State Sync] Edge function result:', { data: syncData, error: syncError });

      if (syncError) {
        console.error(`[HubSpot State Sync] Error syncing state for negocio ${negocioId}:`, syncError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "Error al actualizar estado en HubSpot"
        });
        return;
      }

      if (syncData?.success) {
        console.log('✅ [HubSpot State Sync] SUCCESS - Deal stage updated successfully');
        toast({
          title: "Estado sincronizado",
          description: "Estado actualizado en HubSpot correctamente"
        });
      } else {
        console.error('❌ [HubSpot State Sync] Edge function returned error:', syncData);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: syncData?.error || "Error desconocido al sincronizar"
        });
      }

    } catch (error) {
      console.error(`💥 [HubSpot State Sync] Unexpected error syncing negocio ${negocioId}:`, error);
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
