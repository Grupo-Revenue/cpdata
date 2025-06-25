
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
  
  const { syncQueue, syncStats, loadSyncData } = useSyncData();
  const { isProcessing, processQueue } = useQueueProcessor(loadSyncData);
  const { triggerSync } = useSyncTrigger(processQueue);
  const { retryFailedItems } = useFailedItemsRetry(loadSyncData, processQueue);
  
  useRealtimeSubscription(loadSyncData, processQueue);
  usePeriodicProcessing(config, processQueue);

  // Initial data load
  useEffect(() => {
    if (user) {
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
