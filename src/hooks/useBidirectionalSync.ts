
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Negocio } from '@/types';
import { useHubSpotConfig } from './useHubSpotConfig';
import { calcularValorNegocio } from '@/utils/businessCalculations';

interface StateMapping {
  id: string;
  business_state: string;
  hubspot_pipeline_id: string;
  hubspot_stage_id: string;
}

interface SyncConflict {
  negocio_id: string;
  app_state: string;
  hubspot_state: string;
  app_amount?: number;
  hubspot_amount?: number;
  conflict_type: 'state' | 'amount' | 'both';
  timestamp: string;
}

interface SyncLog {
  id: string;
  negocio_id: string;
  operation_type: string;
  old_state: string;
  new_state: string;
  old_amount?: number;
  new_amount?: number;
  success: boolean;
  error_message: string;
  created_at: string;
}

export const useBidirectionalSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config } = useHubSpotConfig();
  const [stateMappings, setStateMappings] = useState<StateMapping[]>([]);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load state mappings
  const loadStateMappings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hubspot_state_mapping')
        .select('*')
        .eq('user_id', user.id)
        .order('business_state');

      if (error) throw error;
      setStateMappings(data || []);
    } catch (error) {
      console.error('Error loading state mappings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mapeos de estados",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Load sync logs
  const loadSyncLogs = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hubspot_sync_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    }
  }, [user]);

  // Save state mapping
  const saveStateMapping = async (mapping: Omit<StateMapping, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('hubspot_state_mapping')
        .upsert({
          ...mapping,
          user_id: user.id
        });

      if (error) throw error;

      await loadStateMappings();
      toast({
        title: "Mapeo guardado",
        description: "El mapeo de estados se ha guardado correctamente"
      });
    } catch (error) {
      console.error('Error saving state mapping:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el mapeo de estados",
        variant: "destructive"
      });
    }
  };

  // Delete state mapping
  const deleteStateMapping = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hubspot_state_mapping')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadStateMappings();
      toast({
        title: "Mapeo eliminado",
        description: "El mapeo de estados se ha eliminado correctamente"
      });
    } catch (error) {
      console.error('Error deleting state mapping:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el mapeo de estados",
        variant: "destructive"
      });
    }
  };

  // Enhanced sync to HubSpot with better amount handling
  const syncToHubSpot = async (negocioId: string, forceAmountSync: boolean = false) => {
    if (!user) return false;

    setLoading(true);
    try {
      console.log('Syncing business to HubSpot:', negocioId, 'Force amount sync:', forceAmountSync);
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'sync_to_hubspot',
          negocioId,
          userId: user.id,
          forceAmountSync
        }
      });

      if (error) throw error;

      if (data.success) {
        const successMessage = forceAmountSync && data.amountUpdated ? 
          "El negocio y monto se han sincronizado con HubSpot" :
          "El negocio se ha sincronizado con HubSpot";
        
        toast({
          title: "Sincronización exitosa",
          description: successMessage
        });
        await loadSyncLogs();
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error syncing to HubSpot:', error);
      toast({
        title: "Error de sincronización",
        description: error.message || "No se pudo sincronizar con HubSpot",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced sync from HubSpot with better amount handling
  const syncFromHubSpot = async (negocioId: string) => {
    if (!user) return null;

    setLoading(true);
    try {
      console.log('Syncing business from HubSpot:', negocioId);
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'sync_from_hubspot',
          hubspotDealId: negocioId,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        if (data.changed) {
          const changeMessages = [];
          if (data.stateChanged) changeMessages.push(`Estado: ${data.newState}`);
          if (data.amountChanged) changeMessages.push(`Monto actualizado`);
          
          toast({
            title: "Sincronización exitosa",
            description: `Actualizado: ${changeMessages.join(', ')}`
          });
        }
        await loadSyncLogs();
        return data.newState;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error syncing from HubSpot:', error);
      toast({
        title: "Error de sincronización",
        description: error.message || "No se pudo sincronizar desde HubSpot",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced mass sync with better progress reporting
  const syncAllAmountsToHubSpot = async () => {
    if (!user) return false;

    setLoading(true);
    try {
      console.log('Starting mass amount sync to HubSpot...');
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'mass_sync_amounts',
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        const { updated, failed, skipped } = data.results;
        toast({
          title: "Sincronización masiva completada",
          description: `Actualizados: ${updated}, Omitidos: ${skipped}, Fallos: ${failed}`
        });
        await loadSyncLogs();
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error in mass amount sync:', error);
      toast({
        title: "Error de sincronización masiva",
        description: error.message || "No se pudo completar la sincronización masiva",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced polling with better error handling
  const pollHubSpotChanges = async () => {
    if (!user || isPolling) return false;

    if (!config?.bidirectional_sync) {
      console.log('Bidirectional sync is disabled');
      return false;
    }

    setIsPolling(true);
    try {
      console.log('Polling HubSpot for changes...');
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'poll_changes',
          userId: user.id,
          checkAmounts: true
        }
      });

      if (error) throw error;

      if (data.success) {
        const stateChanges = data.results?.filter((r: any) => r.success && r.stateChanged).length || 0;
        const amountChanges = data.results?.filter((r: any) => r.success && r.amountChanged).length || 0;
        const totalChanges = stateChanges + amountChanges;
        
        if (totalChanges > 0) {
          const messages = [];
          if (stateChanges > 0) messages.push(`${stateChanges} estados`);
          if (amountChanges > 0) messages.push(`${amountChanges} montos`);
          
          toast({
            title: "Sincronización completada",
            description: `Actualizados: ${messages.join(' y ')}`
          });
        }
        
        await loadSyncLogs();
        return true;
      } else {
        throw new Error(data.error || 'Error en la sincronización');
      }
    } catch (error) {
      console.error('Error polling HubSpot changes:', error);
      // Only show error toast for non-network errors to avoid spam
      if (!error.message?.includes('fetch')) {
        toast({
          title: "Error de sincronización",
          description: error.message || "No se pudo verificar cambios en HubSpot",
          variant: "destructive"
        });
      }
      return false;
    } finally {
      setIsPolling(false);
    }
  };

  // Enhanced auto-sync when budget is updated
  const syncOnBudgetUpdate = async (negocioId: string) => {
    if (!config?.auto_sync || !config?.api_key_set) {
      console.log('Auto-sync disabled or HubSpot not configured');
      return false;
    }

    console.log('Auto-syncing business after budget update:', negocioId);
    
    // Always force amount sync when budget changes
    const success = await syncToHubSpot(negocioId, true);
    
    if (success) {
      console.log('Budget update sync completed successfully for business:', negocioId);
    } else {
      console.error('Budget update sync failed for business:', negocioId);
    }
    
    return success;
  };

  // Resolve conflict
  const resolveConflict = async (negocioId: string, resolvedState: string, resolvedAmount?: number) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'resolve_conflict',
          negocioId,
          userId: user.id,
          resolvedState,
          resolvedAmount
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conflicto resuelto",
          description: "El conflicto se ha resuelto correctamente"
        });
        
        setSyncConflicts(prev => prev.filter(c => c.negocio_id !== negocioId));
        await loadSyncLogs();
        return true;
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast({
        title: "Error",
        description: "No se pudo resolver el conflicto",
        variant: "destructive"
      });
    }
    return false;
  };

  // Auto-polling setup with configurable intervals
  useEffect(() => {
    if (!user || !config?.bidirectional_sync) return;

    const intervalMinutes = config?.polling_interval_minutes || 30;
    console.log(`Setting up auto-polling with ${intervalMinutes} minute intervals`);
    
    const interval = setInterval(() => {
      pollHubSpotChanges();
    }, intervalMinutes * 60 * 1000);

    // Initial poll after 10 seconds to allow for setup
    const initialPollTimeout = setTimeout(() => {
      pollHubSpotChanges();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialPollTimeout);
    };
  }, [user, config?.bidirectional_sync, config?.polling_interval_minutes]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadStateMappings();
      loadSyncLogs();
    }
  }, [user, loadStateMappings, loadSyncLogs]);

  return {
    stateMappings,
    syncConflicts,
    syncLogs,
    loading,
    isPolling,
    saveStateMapping,
    deleteStateMapping,
    syncToHubSpot,
    syncFromHubSpot,
    syncAllAmountsToHubSpot,
    syncOnBudgetUpdate,
    pollHubSpotChanges,
    resolveConflict,
    loadStateMappings,
    loadSyncLogs
  };
};
