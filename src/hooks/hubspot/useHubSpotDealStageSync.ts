import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EstadoNegocio } from '@/types';

export const useHubSpotDealStageSync = () => {
  const { toast } = useToast();

  const syncDealStage = useCallback(async (negocioId: string, nuevoEstado: EstadoNegocio) => {
    console.log('🔄 [HubSpot Deal Stage Sync] Iniciando sincronización...');
    console.log('🔄 [HubSpot Deal Stage Sync] Negocio ID:', negocioId);
    console.log('🔄 [HubSpot Deal Stage Sync] Nuevo estado:', nuevoEstado);
    
    try {
      // 1. Obtener datos del negocio y verificar que tenga HubSpot ID
      console.log('📊 [HubSpot Deal Stage Sync] Obteniendo datos del negocio...');
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .select('user_id, hubspot_id')
        .eq('id', negocioId)
        .single();

      if (negocioError) {
        console.error('❌ [HubSpot Deal Stage Sync] Error obteniendo negocio:', negocioError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "No se pudo obtener la información del negocio"
        });
        return;
      }

      if (!negocio?.hubspot_id) {
        console.log('⚠️ [HubSpot Deal Stage Sync] Negocio sin HubSpot ID, saltando sincronización');
        return;
      }

      console.log('✅ [HubSpot Deal Stage Sync] Negocio encontrado con HubSpot ID:', negocio.hubspot_id);

      // 2. Obtener el stage_id correspondiente al nuevo estado
      console.log('🎯 [HubSpot Deal Stage Sync] Obteniendo stage_id para estado:', nuevoEstado);
      const { data: stageMapping, error: mappingError } = await supabase
        .from('hubspot_stage_mapping')
        .select('stage_id')
        .eq('user_id', negocio.user_id)
        .eq('estado_negocio', nuevoEstado)
        .single();

      if (mappingError) {
        console.error('❌ [HubSpot Deal Stage Sync] Error obteniendo mapeo de estado:', mappingError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "No se encontró mapeo para el estado en HubSpot"
        });
        return;
      }

      console.log('✅ [HubSpot Deal Stage Sync] Stage ID encontrado:', stageMapping.stage_id);

      // 3. Obtener API key activa del usuario
      console.log('🔑 [HubSpot Deal Stage Sync] Obteniendo API key...');
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('hubspot_api_keys')
        .select('api_key')
        .eq('user_id', negocio.user_id)
        .eq('activo', true)
        .single();

      if (apiKeyError) {
        console.error('❌ [HubSpot Deal Stage Sync] Error obteniendo API key:', apiKeyError);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "No se encontró API key activa de HubSpot"
        });
        return;
      }

      console.log('✅ [HubSpot Deal Stage Sync] API key obtenida');

      // 4. Llamar al endpoint de HubSpot para actualizar el dealstage
      console.log('🚀 [HubSpot Deal Stage Sync] Actualizando dealstage en HubSpot...');
      console.log('🚀 [HubSpot Deal Stage Sync] Deal ID:', negocio.hubspot_id);
      console.log('🚀 [HubSpot Deal Stage Sync] Stage ID:', stageMapping.stage_id);

      const hubspotResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/deals/${negocio.hubspot_id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKeyData.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: {
              dealstage: stageMapping.stage_id
            }
          })
        }
      );

      if (!hubspotResponse.ok) {
        const errorText = await hubspotResponse.text();
        console.error('❌ [HubSpot Deal Stage Sync] Error de HubSpot API:', errorText);
        toast({
          variant: "destructive",
          title: "Error de sincronización con HubSpot",
          description: `Error al actualizar el estado en HubSpot: ${hubspotResponse.status}`
        });
        return;
      }

      const updatedDeal = await hubspotResponse.json();
      console.log('✅ [HubSpot Deal Stage Sync] Deal actualizado exitosamente:', updatedDeal.id);

      // 5. Mostrar notificación de éxito
      toast({
        title: "Estado sincronizado",
        description: "El estado fue actualizado correctamente en HubSpot"
      });

      console.log('🎉 [HubSpot Deal Stage Sync] Sincronización completada exitosamente');

    } catch (error) {
      console.error('💥 [HubSpot Deal Stage Sync] Error inesperado:', error);
      toast({
        variant: "destructive",
        title: "Error de sincronización",
        description: "Error inesperado al sincronizar con HubSpot"
      });
    }
  }, [toast]);

  return {
    syncDealStage
  };
};