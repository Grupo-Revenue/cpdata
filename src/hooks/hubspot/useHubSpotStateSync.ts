import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EstadoNegocio } from '@/types';

export const useHubSpotStateSync = () => {
  const { toast } = useToast();

  const syncStateToHubSpot = useCallback(async (negocioId: string, estadoAnterior: EstadoNegocio, estadoNuevo: EstadoNegocio) => {
    console.log(`🔄 [HubSpot State Sync] STARTING sync for ${negocioId}: ${estadoAnterior} → ${estadoNuevo}`);
    console.log('🔄 [HubSpot State Sync] Function called at:', new Date().toISOString());
    console.log('🔄 [HubSpot State Sync] Input params:', { negocioId, estadoAnterior, estadoNuevo });
    
    try {
      // Step 1: Get business data
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

      // Step 2: Call edge function
      console.log('🚀 [HubSpot State Sync] Step 2: Calling edge function...');
      const { data, error } = await supabase.functions.invoke('hubspot-deal-update', {
        body: {
          negocio_id: negocioId,
          estado_anterior: estadoAnterior,
          estado_nuevo: estadoNuevo
        }
      });

      console.log('🚀 [HubSpot State Sync] Edge function result:', { data, error });

      if (error) {
        console.error('❌ [HubSpot State Sync] Edge function error:', error);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: `Error: ${error.message}`
        });
        return;
      }

      if (data?.success) {
        console.log('✅ [HubSpot State Sync] SUCCESS - Deal stage updated successfully');
        toast({
          title: "Estado sincronizado",
          description: "Estado actualizado en HubSpot correctamente"
        });
      } else {
        console.error('❌ [HubSpot State Sync] Edge function returned error:', data);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: data?.error || "Error desconocido al sincronizar"
        });
      }

    } catch (error) {
      console.error('💥 [HubSpot State Sync] Unexpected error:', error);
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