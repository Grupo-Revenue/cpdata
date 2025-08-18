import { useHubSpotBusinessStateSync } from './useHubSpotBusinessStateSync';
import { useHubSpotAmountSync } from './useHubSpotAmountSync';
import { useHubSpotSyncStats } from './useHubSpotSyncStats';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useHubSpotSync = () => {
  const { toast } = useToast();
  
  // Initialize business state sync (automatic)
  useHubSpotBusinessStateSync();
  
  // Get manual amount sync function
  const { syncAmountToHubSpot } = useHubSpotAmountSync();
  
  // Get sync stats
  const syncStats = useHubSpotSyncStats();

  // Manual sync function for pending records
  const processPendingSyncs = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('process_pending_hubspot_syncs');
      
      if (error) throw error;
      
      const result = data?.[0];
      if (result) {
        toast({
          title: "Sincronización manual completada",
          description: `Procesados: ${result.processed}, Fallidos: ${result.failed}`
        });
        return result;
      }
    } catch (error) {
      console.error('Error processing pending syncs:', error);
      toast({
        variant: "destructive",
        title: "Error en sincronización manual",
        description: "No se pudieron procesar las sincronizaciones pendientes"
      });
    }
  }, [toast]);

  return { 
    syncAmountToHubSpot,
    syncStats,
    processPendingSyncs
  };
};

export default useHubSpotSync;