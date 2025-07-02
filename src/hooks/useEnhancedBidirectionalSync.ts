
import { useEffect } from 'react';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useSyncConflicts } from './sync/useSyncConflicts';
import { useSyncOperations } from './sync/useSyncOperations';
import { useConflictResolution } from './sync/useConflictResolution';

export const useEnhancedBidirectionalSync = () => {
  const { config } = useHubSpotConfig();
  const { syncConflicts, loadSyncConflicts } = useSyncConflicts();
  const { 
    loading: syncLoading, 
    syncToHubSpot, 
    syncFromHubSpot, 
    syncAllAmountsToHubSpot,
    syncOnBudgetUpdate 
  } = useSyncOperations();
  const { resolveConflict, loading: conflictLoading } = useConflictResolution(
    syncConflicts, 
    loadSyncConflicts
  );

  // Load conflicts on mount and when config changes
  useEffect(() => {
    if (config?.bidirectional_sync) {
      console.log('[useEnhancedBidirectionalSync] Loading sync conflicts...');
      loadSyncConflicts().catch(error => {
        console.error('[useEnhancedBidirectionalSync] Error loading conflicts:', error);
      });
    }
  }, [config?.bidirectional_sync, loadSyncConflicts]);

  const loading = syncLoading || conflictLoading;

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
