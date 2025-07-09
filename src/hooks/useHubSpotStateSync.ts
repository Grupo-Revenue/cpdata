import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useHubSpotStateSync = () => {
  useEffect(() => {
    console.log('🔄 [HubSpot Sync] Initializing real-time listener for business state changes');
    
    // Set up real-time listener for business state changes
    const channel = supabase
      .channel('business-state-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negocios',
          filter: 'estado=neq.null'
        },
        async (payload) => {
          console.log('🔄 [HubSpot Sync] Real-time payload received:', payload);
          
          const { new: newRecord, old: oldRecord } = payload;
          
          console.log('🔄 [HubSpot Sync] Comparing states:', {
            old_estado: oldRecord?.estado,
            new_estado: newRecord?.estado,
            negocio_id: newRecord?.id,
            hubspot_id: newRecord?.hubspot_id
          });
          
          // Only sync if the state actually changed
          if (newRecord.estado !== oldRecord.estado) {
            console.log('✅ [HubSpot Sync] Business state changed, triggering HubSpot sync:', {
              negocio_id: newRecord.id,
              estado_anterior: oldRecord.estado,
              estado_nuevo: newRecord.estado,
              hubspot_id: newRecord.hubspot_id
            });

            try {
              // Call the edge function to update HubSpot
              const { data, error } = await supabase.functions.invoke('hubspot-deal-update', {
                body: {
                  negocio_id: newRecord.id,
                  estado_anterior: oldRecord.estado,
                  estado_nuevo: newRecord.estado
                }
              });

              if (error) {
                console.error('❌ [HubSpot Sync] Error syncing state to HubSpot:', error);
              } else {
                console.log('✅ [HubSpot Sync] Successfully synced state to HubSpot:', data);
              }
            } catch (error) {
              console.error('❌ [HubSpot Sync] Unexpected error during HubSpot sync:', error);
            }
          } else {
            console.log('⏭️ [HubSpot Sync] State unchanged, skipping sync');
          }
        }
      )
      .subscribe(status => {
        console.log('🔄 [HubSpot Sync] Channel subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};

export default useHubSpotStateSync;