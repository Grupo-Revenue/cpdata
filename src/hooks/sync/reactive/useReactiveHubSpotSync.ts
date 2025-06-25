
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useSyncData } from './useSyncData';
import { useQueueProcessor } from './useQueueProcessor';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useSyncTrigger } from './useSyncTrigger';
import { useFailedItemsRetry } from './useFailedItemsRetry';

export const useReactiveHubSpotSync = () => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  
  const { syncQueue, syncStats, loadSyncData } = useSyncData();
  const { isProcessing, processQueue } = useQueueProcessor(loadSyncData);
  const { triggerSync } = useSyncTrigger(processQueue);
  const { retryFailedItems } = useFailedItemsRetry(loadSyncData, processQueue);
  
  useRealtimeSubscription(loadSyncData, processQueue);

  // Periodic queue processing
  useEffect(() => {
    if (!config?.auto_sync || !config?.api_key_set) return;

    const interval = setInterval(() => {
      processQueue();
    }, 30000); // Process every 30 seconds

    return () => clearInterval(interval);
  }, [config?.auto_sync, config?.api_key_set, processQueue]);

  // Initial data load
  useEffect(() => {
    if (user) {
      loadSyncData();
    }
  }, [user?.id]);

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
