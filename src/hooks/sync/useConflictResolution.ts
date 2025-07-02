
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/context/SyncContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SyncConflict } from './types';

export const useConflictResolution = (
  syncConflicts: SyncConflict[],
  loadSyncConflicts: () => Promise<void>
) => {
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Resolve sync conflict
  const resolveConflict = useCallback(async (conflictId: string, resolution: 'use_app' | 'use_hubspot') => {
    setLoading(true);
    try {
      const conflict = syncConflicts.find(c => c.id === conflictId);
      if (!conflict) return;

      console.log(`[useConflictResolution] Resolving conflict ${conflictId} with ${resolution}`);

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
      console.error('[useConflictResolution] Error resolving conflict:', error);
      toast({
        title: "Error",
        description: "No se pudo resolver el conflicto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [syncConflicts, user, triggerSync, toast, loadSyncConflicts]);

  return {
    resolveConflict,
    loading
  };
};
