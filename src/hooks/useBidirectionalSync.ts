import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Negocio } from '@/types';
import { useHubSpotConfig } from './useHubSpotConfig';

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
  timestamp: string;
}

interface SyncLog {
  id: string;
  negocio_id: string;
  operation_type: string;
  old_state: string;
  new_state: string;
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

  // Sync business to HubSpot
  const syncToHubSpot = async (negocioId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Syncing business to HubSpot:', negocioId);
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'sync_to_hubspot',
          negocioId,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sincronización exitosa",
          description: "El negocio se ha sincronizado con HubSpot"
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

  // Sync from HubSpot
  const syncFromHubSpot = async (negocioId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Syncing business from HubSpot:', negocioId);
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'sync_from_hubspot',
          hubspotDealId: negocioId, // This can be either negocio ID or HubSpot deal ID
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        if (data.changed) {
          toast({
            title: "Sincronización exitosa",
            description: `Estado actualizado a: ${data.newState}`
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

  // Poll HubSpot for changes
  const pollHubSpotChanges = async () => {
    if (!user || isPolling) return;

    // Check if bidirectional sync is enabled
    if (!config?.bidirectional_sync) {
      console.log('Bidirectional sync is disabled');
      toast({
        title: "Sincronización deshabilitada",
        description: "La sincronización bidireccional no está habilitada",
        variant: "destructive"
      });
      return;
    }

    setIsPolling(true);
    try {
      console.log('Polling HubSpot for changes...');
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'poll_changes',
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        const changedCount = data.results?.filter((r: any) => r.success && r.changed).length || 0;
        const failedSyncs = data.results?.filter((r: any) => !r.success) || [];
        
        if (changedCount > 0) {
          toast({
            title: "Sincronización completada",
            description: `${changedCount} negocios actualizados desde HubSpot`
          });
        } else {
          toast({
            title: "Sincronización completada",
            description: "No se encontraron cambios en HubSpot"
          });
        }
        
        if (failedSyncs.length > 0) {
          console.error('Failed syncs:', failedSyncs);
          toast({
            title: "Sincronización parcial",
            description: `${failedSyncs.length} negocios no se pudieron sincronizar`,
            variant: "destructive"
          });
        }
        
        await loadSyncLogs();
        return true;
      } else {
        throw new Error(data.error || 'Error en la sincronización');
      }
    } catch (error) {
      console.error('Error polling HubSpot changes:', error);
      toast({
        title: "Error de sincronización",
        description: error.message || "No se pudo verificar cambios en HubSpot",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsPolling(false);
    }
  };

  // Resolve conflict
  const resolveConflict = async (negocioId: string, resolvedState: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('hubspot-bidirectional-sync', {
        body: {
          action: 'resolve_conflict',
          negocioId,
          userId: user.id,
          resolvedState
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conflicto resuelto",
          description: "El conflicto se ha resuelto correctamente"
        });
        
        // Remove from conflicts list
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
    pollHubSpotChanges,
    resolveConflict,
    loadStateMappings,
    loadSyncLogs
  };
};
