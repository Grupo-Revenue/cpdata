
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from './useHubSpotConfig';
import { useReactiveHubSpotSync } from './useReactiveHubSpotSync';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SyncConflict {
  id: string;
  negocio_id: string;
  conflict_type: 'state' | 'amount' | 'both';
  app_state: string;
  hubspot_state: string;
  app_amount: number;
  hubspot_amount: number;
  status: string;
}

export const useEnhancedBidirectionalSync = () => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const { triggerSync } = useReactiveHubSpotSync();
  const { toast } = useToast();
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(false);

  // Load sync conflicts
  const loadSyncConflicts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hubspot_sync_conflicts')
        .select(`
          *,
          negocios!inner(user_id)
        `)
        .eq('negocios.user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSyncConflicts(data || []);
    } catch (error) {
      console.error('[useEnhancedBidirectionalSync] Error loading conflicts:', error);
    }
  }, [user]);

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
      console.log(`[useEnhancedBidirectionalSync] Syncing to HubSpot: ${negocioId}, forceAmount: ${forceAmount}`);

      // Use the reactive sync system to queue the operation
      await triggerSync(negocioId, forceAmount ? 'force_amount_update' : 'update', 3);

      toast({
        title: "Sincronización iniciada",
        description: "Los datos se están sincronizando con HubSpot"
      });

    } catch (error) {
      console.error('[useEnhancedBidirectionalSync] Error syncing to HubSpot:', error);
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
      console.log(`[useEnhancedBidirectionalSync] Syncing from HubSpot: ${negocioId}`);

      // Use the reactive sync system to queue the operation
      await triggerSync(negocioId, 'sync_from_hubspot', 2);

      toast({
        title: "Sincronización iniciada",
        description: "Los datos se están obteniendo desde HubSpot"
      });

    } catch (error) {
      console.error('[useEnhancedBidirectionalSync] Error syncing from HubSpot:', error);
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
      console.log('[useEnhancedBidirectionalSync] Starting mass amount sync');

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
      console.error('[useEnhancedBidirectionalSync] Error in mass sync:', error);
      toast({
        title: "Error en sincronización masiva",
        description: "No se pudo completar la sincronización masiva",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [config, user, triggerSync, toast]);

  // Resolve sync conflict
  const resolveConflict = useCallback(async (conflictId: string, resolution: 'use_app' | 'use_hubspot') => {
    setLoading(true);
    try {
      const conflict = syncConflicts.find(c => c.id === conflictId);
      if (!conflict) return;

      console.log(`[useEnhancedBidirectionalSync] Resolving conflict ${conflictId} with ${resolution}`);

      // Update conflict status
      const { error: conflictError } = await supabase
        .from('hubspot_sync_conflicts')
        .update({
          status: 'resolved',
          resolution_strategy: resolution,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', conflictId);

      if (conflictError) throw conflictError;

      // Trigger appropriate sync based on resolution
      if (resolution === 'use_app') {
        await triggerSync(conflict.negocio_id, 'resolve_conflict_use_app', 1);
      } else {
        await triggerSync(conflict.negocio_id, 'resolve_conflict_use_hubspot', 1);
      }

      toast({
        title: "Conflicto resuelto",
        description: `Se aplicará la resolución usando ${resolution === 'use_app' ? 'datos de la app' : 'datos de HubSpot'}`
      });

      // Reload conflicts
      await loadSyncConflicts();

    } catch (error) {
      console.error('[useEnhancedBidirectionalSync] Error resolving conflict:', error);
      toast({
        title: "Error",
        description: "No se pudo resolver el conflicto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [syncConflicts, user, triggerSync, toast, loadSyncConflicts]);

  // Sync on budget update (triggered by components)
  const syncOnBudgetUpdate = useCallback(async (negocioId: string) => {
    if (!config?.api_key_set || !config?.auto_sync) return;

    console.log(`[useEnhancedBidirectionalSync] Budget updated, triggering sync for ${negocioId}`);
    
    // Use lower priority for automatic syncs
    await triggerSync(negocioId, 'budget_update', 6);
  }, [config, triggerSync]);

  // Load conflicts on mount and when config changes
  useEffect(() => {
    if (config?.bidirectional_sync) {
      loadSyncConflicts();
    }
  }, [config?.bidirectional_sync, loadSyncConflicts]);

  // Listen to conflict changes
  useEffect(() => {
    if (!user || !config?.bidirectional_sync) return;

    const channel = supabase
      .channel('sync-conflicts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hubspot_sync_conflicts'
        },
        () => {
          console.log('[useEnhancedBidirectionalSync] Conflict changes detected');
          loadSyncConflicts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, config?.bidirectional_sync, loadSyncConflicts]);

  return {
    syncConflicts,
    loading,
    syncToHubSpot,
    syncFromHubSpot,
    syncAllAmountsToHubSpot,
    syncOnBudgetUpdate,
    resolveConflict,
    loadSyncConflicts
  };
};
