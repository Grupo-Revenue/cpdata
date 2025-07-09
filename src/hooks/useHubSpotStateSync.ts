import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useHubSpotStateSync = () => {
  useEffect(() => {
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
          const { new: newRecord, old: oldRecord } = payload;
          
          // Only sync if the state actually changed
          if (newRecord.estado !== oldRecord.estado) {
            console.log('Business state changed, triggering HubSpot sync:', {
              negocio_id: newRecord.id,
              estado_anterior: oldRecord.estado,
              estado_nuevo: newRecord.estado
            });

            try {
              // Call the edge function to update HubSpot
              const { error } = await supabase.functions.invoke('hubspot-deal-update', {
                body: {
                  negocio_id: newRecord.id,
                  estado_anterior: oldRecord.estado,
                  estado_nuevo: newRecord.estado
                }
              });

              if (error) {
                console.error('Error syncing state to HubSpot:', error);
              } else {
                console.log('Successfully synced state to HubSpot');
              }
            } catch (error) {
              console.error('Unexpected error during HubSpot sync:', error);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};

export default useHubSpotStateSync;