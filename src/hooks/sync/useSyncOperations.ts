
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useReactiveHubSpotSync } from '@/hooks/useReactiveHubSpotSync';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useSyncOperations = () => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const { triggerSync } = useReactiveHubSpotSync();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Enhanced sync to HubSpot with queue integration
  const syncToHubSpot = useCallback(async (negocioId: string, forceAmount: boolean = false) => {
    if (!config?.api_key_set) {
      toast({
        title: "HubSpot no configurado",
        description: "Configure HubSpot en la configuración antes de sincronizar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`[useSyncOperations] Syncing to HubSpot: ${negocioId}, forceAmount: ${forceAmount}`);

      // Use the reactive sync system to queue the operation
      await triggerSync(negocioId, forceAmount ? 'force_amount_update' : 'update', 3);

      toast({
        title: "Sincronización iniciada",
        description: "Los datos se están sincronizando con HubSpot"
      });

    } catch (error) {
      console.error('[useSyncOperations] Error syncing to HubSpot:', error);
      toast({
        title: "Error de sincronización",
        description: "No se pudo sincronizar con HubSpot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [config, triggerSync, toast]);

  // Enhanced sync from HubSpot
  const syncFromHubSpot = useCallback(async (negocioId: string) => {
    if (!config?.api_key_set) {
      toast({
        title: "HubSpot no configurado",
        description: "Configure HubSpot en la configuración antes de sincronizar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`[useSyncOperations] Syncing from HubSpot: ${negocioId}`);

      // Use the reactive sync system to queue the operation
      await triggerSync(negocioId, 'sync_from_hubspot', 2);

      toast({
        title: "Sincronización iniciada",
        description: "Los datos se están obteniendo desde HubSpot"
      });

    } catch (error) {
      console.error('[useSyncOperations] Error syncing from HubSpot:', error);
      toast({
        title: "Error de sincronización",
        description: "No se pudo obtener datos desde HubSpot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [config, triggerSync, toast]);

  // Mass sync all amounts to HubSpot
  const syncAllAmountsToHubSpot = useCallback(async () => {
    if (!config?.api_key_set) {
      toast({
        title: "HubSpot no configurado",
        description: "Configure HubSpot antes de realizar la sincronización masiva",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('[useSyncOperations] Starting mass amount sync');

      // Get all user's negocios
      const { data: negocios, error } = await supabase
        .from('negocios')
        .select('id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (negocios && negocios.length > 0) {
        // Queue sync operations for all negocios
        const syncPromises = negocios.map((negocio, index) =>
          triggerSync(negocio.id, 'mass_amount_sync', 4)
        );

        await Promise.all(syncPromises);

        toast({
          title: "Sincronización masiva iniciada",
          description: `Se han programado ${negocios.length} operaciones de sincronización`
        });
      }

    } catch (error) {
      console.error('[useSyncOperations] Error in mass sync:', error);
      toast({
        title: "Error en sincronización masiva",
        description: "No se pudo completar la sincronización masiva",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [config, user, triggerSync, toast]);

  // Sync on budget update (triggered by components)
  const syncOnBudgetUpdate = useCallback(async (negocioId: string) => {
    if (!config?.api_key_set || !config?.auto_sync) return;

    console.log(`[useSyncOperations] Budget updated, triggering sync for ${negocioId}`);
    
    // Use lower priority for automatic syncs
    await triggerSync(negocioId, 'budget_update', 6);
  }, [config, triggerSync]);

  return {
    loading,
    syncToHubSpot,
    syncFromHubSpot,
    syncAllAmountsToHubSpot,
    syncOnBudgetUpdate
  };
};
