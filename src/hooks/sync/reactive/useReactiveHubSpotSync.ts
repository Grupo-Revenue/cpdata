
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useSyncData } from './useSyncData';
import { useQueueProcessor } from './useQueueProcessor';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useSyncTrigger } from './useSyncTrigger';
import { useFailedItemsRetry } from './useFailedItemsRetry';
import { usePeriodicProcessing } from './usePeriodicProcessing';

export const useReactiveHubSpotSync = () => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  
  console.log(`[useReactiveHubSpotSync] Initializing for user ${user?.id}`);
  
  const { syncQueue, syncStats, loadSyncData } = useSyncData();
  const { isProcessing, processQueue } = useQueueProcessor(loadSyncData);
  const { triggerSync } = useSyncTrigger(processQueue);
  const { retryFailedItems } = useFailedItemsRetry(loadSyncData, processQueue);
  
  useRealtimeSubscription(loadSyncData, processQueue);
  usePeriodicProcessing(config, processQueue);

  // Initial data load
  useEffect(() => {
    if (user) {
      console.log(`[useReactiveHubSpotSync] Loading initial data for user ${user.id}`);
      loadSyncData();
    }
  }, [user?.id, loadSyncData]);

  return {
    syncQueue,
    syncStats,
    isProcessing,
    triggerSync,
    retryFailedItems,
    loadSyncData,
    processQueue
  };
};
