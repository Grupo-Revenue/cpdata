import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateBusinessValue } from '@/utils/businessValueCalculator';

export const useHubSpotStateSync = () => {
  const channelRef = useRef<any>(null);
  const presupuestosChannelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    // Prevent multiple subscriptions
    if (isSubscribedRef.current) {
      console.log('🔄 [HubSpot Sync] Already subscribed, skipping');
      return;
    }

    console.log('🔄 [HubSpot Sync] Initializing real-time listeners for business state and value changes');
    
    // Create unique channel names with timestamp to avoid conflicts
    const channelName = `business-state-changes-${Date.now()}`;
    const presupuestosChannelName = `presupuestos-changes-${Date.now()}`;
    
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
                toast({
                  variant: "destructive",
                  title: "Error de sincronización",
                  description: "No se pudo sincronizar el estado del negocio con HubSpot"
                });
              } else {
                console.log('✅ [HubSpot Sync] Successfully synced state to HubSpot:', data);
              }
            } catch (error) {
              console.error('❌ [HubSpot Sync] Unexpected error during HubSpot sync:', error);
              toast({
                variant: "destructive", 
                title: "Error de sincronización",
                description: "Error inesperado al sincronizar con HubSpot"
              });
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

    // Set up real-time listener for presupuestos changes (to sync amount)
    const presupuestosChannel = supabase
      .channel(presupuestosChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presupuestos'
        },
        async (payload) => {
          console.log('💰 [HubSpot Amount Sync] Presupuesto change detected:', {
            event: payload.eventType,
            table: payload.table,
            payload
          });
          
          const { new: newRecord, old: oldRecord } = payload;
          const negocioId = (newRecord as any)?.negocio_id || (oldRecord as any)?.negocio_id;
          
          if (!negocioId) {
            console.log('⚠️ [HubSpot Sync] No negocio_id found in presupuesto payload');
            return;
          }

          try {
            // Get full business data with presupuestos to calculate new total
            const { data: negocioData, error: negocioError } = await supabase
              .from('negocios')
              .select(`
                id,
                hubspot_id,
                user_id,
                presupuestos:presupuestos(
                  id,
                  total,
                  estado
                )
              `)
              .eq('id', negocioId)
              .single();

            if (negocioError || !negocioData) {
              console.error('❌ [HubSpot Sync] Error getting business data:', negocioError);
              return;
            }

            // Skip if no HubSpot ID
            if (!negocioData.hubspot_id) {
              console.log('⚠️ [HubSpot Sync] Business has no HubSpot ID, skipping amount sync');
              return;
            }

            // Calculate new total value
            const newAmount = calculateBusinessValue(negocioData as any);
            
            console.log('💰 [HubSpot Sync] Calculated new business amount:', {
              negocio_id: negocioId,
              new_amount: newAmount,
              hubspot_id: negocioData.hubspot_id
            });

            // Call edge function to update amount in HubSpot
            const { data, error } = await supabase.functions.invoke('hubspot-deal-amount-update', {
              body: {
                negocio_id: negocioId,
                amount: newAmount
              }
            });

            if (error) {
              console.error('❌ [HubSpot Sync] Error syncing amount to HubSpot:', error);
              toast({
                variant: "destructive",
                title: "Error de sincronización",
                description: "No se pudo sincronizar el valor del negocio con HubSpot"
              });
            } else {
              console.log('✅ [HubSpot Sync] Successfully synced amount to HubSpot:', data);
              toast({
                title: "Sincronización exitosa",
                description: `Valor actualizado en HubSpot: ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(newAmount)}`,
                className: "bg-green-50 border-green-200"
              });
            }
          } catch (error) {
            console.error('❌ [HubSpot Sync] Unexpected error during amount sync:', error);
            toast({
              variant: "destructive",
              title: "Error de sincronización", 
              description: "Error inesperado al sincronizar el valor con HubSpot"
            });
          }
        }
      )
      .subscribe(status => {
        console.log('💰 [HubSpot Sync] Presupuestos channel subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [HubSpot Sync] Successfully subscribed to presupuestos changes');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('❌ [HubSpot Sync] Presupuestos subscription error:', status);
        }
      });

    presupuestosChannelRef.current = presupuestosChannel;

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 [HubSpot Sync] Cleaning up subscriptions');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (presupuestosChannelRef.current) {
        supabase.removeChannel(presupuestosChannelRef.current);
        presupuestosChannelRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, []); // Empty dependency array to run only once
};

export default useHubSpotStateSync;