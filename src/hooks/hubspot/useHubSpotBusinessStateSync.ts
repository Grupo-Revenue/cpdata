import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useHubSpotBusinessStateSync = () => {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    // Prevent multiple subscriptions
    if (isSubscribedRef.current) {
      console.log('🔄 [HubSpot State Sync] Already subscribed, skipping');
      return;
    }

    console.log('🔄 [HubSpot State Sync] Initializing real-time listener for business state changes');
    
    // Create simple channel name for better reliability
    const channelName = 'business-state-changes';
    
    // Set up real-time listener for business state changes
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: channelName }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negocios'
        },
        async (payload) => {
          console.log('🔄 [HubSpot State Sync] Real-time payload received:', payload);
          
          const { new: newRecord, old: oldRecord } = payload;
          
          // Validate that both records exist and have valid states
          if (!newRecord || !oldRecord || !newRecord.estado || !oldRecord.estado) {
            console.log('⚠️ [HubSpot State Sync] Invalid payload data, skipping:', {
              newRecord: !!newRecord,
              oldRecord: !!oldRecord,
              newEstado: newRecord?.estado,
              oldEstado: oldRecord?.estado
            });
            return;
          }
          
          console.log('🔄 [HubSpot State Sync] Comparing states:', {
            old_estado: oldRecord.estado,
            new_estado: newRecord.estado,
            negocio_id: newRecord.id,
            hubspot_id: newRecord.hubspot_id
          });
          
          // Only sync if the state actually changed
          if (newRecord.estado !== oldRecord.estado) {
            console.log('✅ [HubSpot State Sync] Business state changed, triggering HubSpot sync:', {
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
                console.error('❌ [HubSpot State Sync] Error syncing state to HubSpot:', error);
                toast({
                  variant: "destructive",
                  title: "Error de sincronización",
                  description: "No se pudo sincronizar el estado del negocio con HubSpot"
                });
              } else {
                console.log('✅ [HubSpot State Sync] Successfully synced state to HubSpot:', data);
              }
            } catch (error) {
              console.error('❌ [HubSpot State Sync] Unexpected error during HubSpot sync:', error);
              toast({
                variant: "destructive", 
                title: "Error de sincronización",
                description: "Error inesperado al sincronizar con HubSpot"
              });
            }
          } else {
            console.log('⏭️ [HubSpot State Sync] State unchanged, skipping sync');
          }
        }
      )
      .subscribe(status => {
        console.log('🔄 [HubSpot State Sync] Channel subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [HubSpot State Sync] Successfully subscribed to business state changes');
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('❌ [HubSpot State Sync] Subscription error:', status);
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 [HubSpot State Sync] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, []); // Empty dependency array to run only once
};