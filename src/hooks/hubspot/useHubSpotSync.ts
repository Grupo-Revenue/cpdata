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
      console.log('🔄 [Manual Sync] Starting manual sync process');
      
      const { data, error } = await supabase.rpc('process_pending_hubspot_syncs');
      
      if (error) {
        console.error('❌ [Manual Sync] RPC error:', error);
        throw error;
      }
      
      const result = data?.[0];
      console.log('📊 [Manual Sync] Result:', result);
      
      if (result) {
        const successMessage = result.processed > 0 
          ? `✅ Procesados: ${result.processed}`
          : '';
        const failedMessage = result.failed > 0 
          ? `❌ Fallidos: ${result.failed}` 
          : '';
        const description = [successMessage, failedMessage].filter(Boolean).join(', ') || 'Sin cambios';
        
        toast({
          title: "Sincronización manual completada",
          description,
          variant: result.failed > 0 ? "destructive" : "default"
        });
        return result;
      } else {
        toast({
          title: "Sincronización completada",
          description: "No hay registros pendientes por procesar"
        });
      }
    } catch (error) {
      console.error('❌ [Manual Sync] Error processing pending syncs:', error);
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