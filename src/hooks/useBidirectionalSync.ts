
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
  id: string;
  negocio_id: string;
  app_state: string;
  hubspot_state: string;
  app_amount?: number;
  hubspot_amount?: number;
  conflict_type: 'state' | 'amount' | 'both';
  status: 'pending' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

interface SyncLog {
  id: string;
  negocio_id: string;
  operation_type: string;
  old_state?: string;
  new_state?: string;
  old_amount?: number;
  new_amount?: number;
  success: boolean;
  error_message?: string;
  created_at: string;
  sync_direction?: 'inbound' | 'outbound' | 'resolution';
  force_sync?: boolean;
  hubspot_old_stage?: string;
  hubspot_new_stage?: string;
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

  // Load state mappings with better error handling
  const loadStateMappings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hubspot_state_mapping')
        .select('*')
        .eq('user_id', user.id)
        .order('business_state');

      if (error) {
        console.error('Error loading state mappings:', error);
        throw error;
      }
      
      console.log('Loaded state mappings:', data?.length || 0);
      setStateMappings(data || []);
    } catch (error) {
      console.error('Error in loadStateMappings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mapeos de estados",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Load sync conflicts
  const loadSyncConflicts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hubspot_sync_conflicts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sync conflicts:', error);
        throw error;
      }
      
      console.log('Loaded sync conflicts:', data?.length || 0);
      setSyncConflicts(data || []);
    } catch (error) {
      console.error('Error in loadSyncConflicts:', error);
    }
  }, [user]);

  // Load sync logs with better filtering
  const loadSyncLogs = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hubspot_sync_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading sync logs:', error);
        throw error;
      }
      
      console.log('Loaded sync logs:', data?.length || 0);
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error in loadSyncLogs:', error);
    }
  }, [user]);

  // Save state mapping with validation
  const saveStateMapping = async (mapping: Omit<StateMapping, 'id'>) => {
    if (!user) return;

    try {
      console.log('Saving state mapping:', mapping);
      
      const { error } = await supabase
        .from('hubspot_state_mapping')
        .upsert({
          ...mapping,
          user_id: user.id
        });

      if (error) {
        console.error('Error saving state mapping:', error);
        throw error;
      }

      await loadStateMappings();
      toast({
        title: "Mapeo guardado",
        description: "El mapeo de estados se ha guardado correctamente"
      });
    } catch (error) {
      console.error('Error in saveStateMapping:', error);
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
      console.log('Deleting state mapping:', id);
      
      const { error } = await supabase
        .from('hubspot_state_mapping')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting state mapping:', error);
        throw error;
      }

      await loadStateMappings();
      toast({
        title: "Mapeo eliminado",
        description: "El mapeo de estados se ha eliminado correctamente"
      });
    } catch (error) {
      console.error('Error in deleteStateMapping:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el mapeo de estados",
        variant: "destructive"
      });
    }
  };

  // Enhanced sync to HubSpot with conflict detection
  const syncToHubSpot = async (negocioId: string, forceAmountSync: boolean = false) => {
    if (!user) {
      console.error('No user authenticated for sync');
      return false;
    }

    if (!config?.api_key_set) {
      console.error('HubSpot API key not configured');
      toast({
        title: "Configuración requerida",
        description: "Configura la API key de HubSpot primero",
        variant: "destructive"
      });
      return false;
    }

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

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.conflict) {
        console.log('Conflict detected during sync:', data.conflictData);
        await loadSyncConflicts(); // Reload conflicts
        
        toast({
          title: "Conflicto detectado",
          description: "Se ha detectado un conflicto que requiere resolución manual",
          variant: "destructive"
        });
        return false;
      }

      if (data?.success) {
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
        console.error('Sync failed:', data?.error);
        throw new Error(data?.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error in syncToHubSpot:', error);
      
      // Show more specific error messages
      let errorMessage = "No se pudo sincronizar con HubSpot";
      if (error.message?.includes('mapping')) {
        errorMessage = "Configura los mapeos de estados primero";
      } else if (error.message?.includes('API')) {
        errorMessage = "Error de API de HubSpot - verifica tu configuración";
      }
      
      toast({
        title: "Error de sincronización",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced sync from HubSpot with better validation
  const syncFromHubSpot = async (negocioId: string) => {
    if (!user) {
      console.error('No user authenticated for sync');
      return null;
    }

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

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.success) {
        if (data.changed) {
          const changeMessages = [];
          if (data.stateChanged) changeMessages.push(`Estado: ${data.newState}`);
          if (data.amountChanged) changeMessages.push(`Monto actualizado`);
          if (data.closeDateChanged) changeMessages.push(`Fecha de cierre actualizada`);
          
          if (changeMessages.length > 0) {
            toast({
              title: "Sincronización exitosa",
              description: `Actualizado: ${changeMessages.join(', ')}`
            });
          }
        }
        await loadSyncLogs();
        return data.newState;
      } else {
        console.error('Sync from HubSpot failed:', data?.error);
        throw new Error(data?.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error in syncFromHubSpot:', error);
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
    if (!user) {
      console.error('No user authenticated for mass sync');
      return false;
    }

    if (!config?.api_key_set) {
      toast({
        title: "Configuración requerida",
        description: "Configura la API key de HubSpot primero",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      console.log('Starting mass amount sync to HubSpot...');
      
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'mass_sync_amounts',
          userId: user.id
        }
      });

      if (error) {
        console.error('Mass sync edge function error:', error);
        throw error;
      }

      if (data?.success) {
        const { updated, failed, skipped } = data.results || { updated: 0, failed: 0, skipped: 0 };
        toast({
          title: "Sincronización masiva completada",
          description: `Actualizados: ${updated}, Omitidos: ${skipped}, Fallos: ${failed}`
        });
        await loadSyncLogs();
        return true;
      } else {
        console.error('Mass sync failed:', data?.error);
        throw new Error(data?.error || 'Mass sync failed');
      }
    } catch (error) {
      console.error('Error in syncAllAmountsToHubSpot:', error);
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

  // Enhanced polling with better error handling and configuration checks
  const pollHubSpotChanges = async () => {
    if (!user || isPolling) return false;

    if (!config?.bidirectional_sync || !config?.api_key_set) {
      console.log('Bidirectional sync is disabled or not configured');
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

      if (error) {
        console.error('Polling edge function error:', error);
        throw error;
      }

      if (data?.success) {
        const results = data.results || [];
        const stateChanges = results.filter((r: any) => r.success && r.stateChanged).length;
        const amountChanges = results.filter((r: any) => r.success && r.amountChanged).length;
        const closeDateChanges = results.filter((r: any) => r.success && r.closeDateChanged).length;
        const totalChanges = stateChanges + amountChanges + closeDateChanges;
        
        if (totalChanges > 0) {
          const messages = [];
          if (stateChanges > 0) messages.push(`${stateChanges} estados`);
          if (amountChanges > 0) messages.push(`${amountChanges} montos`);
          if (closeDateChanges > 0) messages.push(`${closeDateChanges} fechas de cierre`);
          
          toast({
            title: "Sincronización completada",
            description: `Actualizados: ${messages.join(', ')}`
          });
        }
        
        await loadSyncLogs();
        await loadSyncConflicts(); // Check for new conflicts
        return true;
      } else {
        console.error('Polling failed:', data?.error);
        throw new Error(data?.error || 'Error en la sincronización');
      }
    } catch (error) {
      console.error('Error in pollHubSpotChanges:', error);
      
      // Only show error toast for non-network errors and not too frequently
      if (!error.message?.includes('fetch') && !error.message?.includes('network')) {
        toast({
          title: "Error de sincronización",
          description: "Problema temporal con la sincronización de HubSpot",
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

  // Enhanced conflict resolution with better validation
  const resolveConflict = async (negocioId: string, resolvedState: string, resolvedAmount?: number) => {
    if (!user) {
      console.error('No user authenticated for conflict resolution');
      return false;
    }

    try {
      console.log('Resolving conflict for negocio:', negocioId, 'with state:', resolvedState);
      
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'resolve_conflict',
          negocioId,
          userId: user.id,
          resolvedState,
          resolvedAmount
        }
      });

      if (error) {
        console.error('Conflict resolution edge function error:', error);
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Conflicto resuelto",
          description: "El conflicto se ha resuelto correctamente"
        });
        
        setSyncConflicts(prev => prev.filter(c => c.negocio_id !== negocioId));
        await loadSyncLogs();
        return true;
      } else {
        console.error('Conflict resolution failed:', data?.error);
        throw new Error(data?.error || 'Failed to resolve conflict');
      }
    } catch (error) {
      console.error('Error in resolveConflict:', error);
      toast({
        title: "Error",
        description: "No se pudo resolver el conflicto",
        variant: "destructive"
      });
    }
    return false;
  };

  // Auto-polling setup with better configuration checks
  useEffect(() => {
    if (!user || !config?.bidirectional_sync || !config?.api_key_set) {
      console.log('Auto-polling disabled: user, bidirectional sync, or API key not configured');
      return;
    }

    const intervalMinutes = config?.polling_interval_minutes || 30;
    console.log(`Setting up auto-polling with ${intervalMinutes} minute intervals`);
    
    const interval = setInterval(() => {
      pollHubSpotChanges();
    }, intervalMinutes * 60 * 1000);

    // Initial poll after 30 seconds to allow for setup
    const initialPollTimeout = setTimeout(() => {
      pollHubSpotChanges();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialPollTimeout);
    };
  }, [user, config?.bidirectional_sync, config?.api_key_set, config?.polling_interval_minutes]);

  // Load initial data with dependency checks
  useEffect(() => {
    if (user) {
      console.log('Loading initial sync data for user:', user.id);
      loadStateMappings();
      loadSyncLogs();
      loadSyncConflicts();
    }
  }, [user, loadStateMappings, loadSyncLogs, loadSyncConflicts]);

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
    loadSyncLogs,
    loadSyncConflicts
  };
};
