
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useSyncData } from './useSyncData';
import { useQueueProcessor } from './useQueueProcessor';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useSyncTrigger } from './useSyncTrigger';
import { useFailedItemsRetry } from './useFailedItemsRetry';
import { usePeriodicProcessing } from './usePeriodicProcessing';

// Singleton pattern to prevent multiple instances
let singletonInstance: any = null;
let instanceCount = 0;

export const useReactiveHubSpotSync = () => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const instanceRef = useRef<number>(++instanceCount);
  
  // If singleton exists and user hasn't changed, return it
  if (singletonInstance && singletonInstance.userId === user?.id) {
    console.log(`[useReactiveHubSpotSync] Returning existing instance for user ${user?.id}`);
    return singletonInstance.data;
  }

  console.log(`[useReactiveHubSpotSync] Creating new instance #${instanceRef.current} for user ${user?.id}`);
  
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

  const hookData = {
    syncQueue,
    syncStats,
    isProcessing,
    triggerSync,
    retryFailedItems,
    loadSyncData,
    processQueue
  };

  // Update singleton
  singletonInstance = {
    userId: user?.id,
    data: hookData
  };

  return hookData;
};
