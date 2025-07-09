import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useHubSpotStateSync = () => {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple subscriptions
    if (isSubscribedRef.current) {
      console.log('🔄 [HubSpot Sync] Already subscribed, skipping');
      return;
    }

    console.log('🔄 [HubSpot Sync] Initializing real-time listener for business state changes');
    
    // Create unique channel name with timestamp to avoid conflicts
    const channelName = `business-state-changes-${Date.now()}`;
    
    // Set up real-time listener for business state changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negocios'
        },
        async (payload) => {
          console.log('🔄 [HubSpot Sync] Real-time payload received:', payload);
          
          const { new: newRecord, old: oldRecord } = payload;
          
          // Validate that both records exist and have valid states
          if (!newRecord || !oldRecord || !newRecord.estado || !oldRecord.estado) {
            console.log('⚠️ [HubSpot Sync] Invalid payload data, skipping:', {
              newRecord: !!newRecord,
              oldRecord: !!oldRecord,
              newEstado: newRecord?.estado,
              oldEstado: oldRecord?.estado
            });
            return;
          }
          
          console.log('🔄 [HubSpot Sync] Comparing states:', {
            old_estado: oldRecord.estado,
            new_estado: newRecord.estado,
            negocio_id: newRecord.id,
            hubspot_id: newRecord.hubspot_id
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
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [HubSpot Sync] Successfully subscribed to business state changes');
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('❌ [HubSpot Sync] Subscription error:', status);
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 [HubSpot Sync] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, []); // Empty dependency array to run only once
};

export default useHubSpotStateSync;