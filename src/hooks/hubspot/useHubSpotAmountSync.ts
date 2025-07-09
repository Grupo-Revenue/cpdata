import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateBusinessValue } from '@/utils/businessValueCalculator';

export const useHubSpotAmountSync = () => {
  const { toast } = useToast();

  const syncAmountToHubSpot = useCallback(async (negocioId: string) => {
    console.log('💰 [HubSpot Amount Sync] Manual sync triggered for negocio:', negocioId);

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
        console.error('❌ [HubSpot Amount Sync] Error getting business data:', negocioError);
        return;
      }

      // Skip if no HubSpot ID
      if (!negocioData.hubspot_id) {
        console.log('⚠️ [HubSpot Amount Sync] Business has no HubSpot ID, skipping amount sync');
        return;
      }

      // Calculate new total value
      const newAmount = calculateBusinessValue(negocioData as any);
      
      console.log('💰 [HubSpot Amount Sync] Calculated new business amount:', {
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
        console.error('❌ [HubSpot Amount Sync] Error syncing amount to HubSpot:', error);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "No se pudo sincronizar el valor del negocio con HubSpot"
        });
      } else {
        console.log('✅ [HubSpot Amount Sync] Successfully synced amount to HubSpot:', data);
        toast({
          title: "Sincronización exitosa",
          description: `Valor actualizado en HubSpot: ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(newAmount)}`,
          className: "bg-green-50 border-green-200"
        });
      }
    } catch (error) {
      console.error('❌ [HubSpot Amount Sync] Unexpected error during amount sync:', error);
      toast({
        variant: "destructive",
        title: "Error de sincronización", 
        description: "Error inesperado al sincronizar el valor con HubSpot"
      });
    }
  }, [toast]);

  return { syncAmountToHubSpot };
};