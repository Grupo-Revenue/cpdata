
import React, { createContext, useContext, ReactNode } from 'react';
import { useReactiveHubSpotSync } from '@/hooks/sync/reactive/useReactiveHubSpotSync';
import { SyncQueueItem, SyncStats } from '@/hooks/sync/reactive/types';

interface SyncContextType {
  syncQueue: SyncQueueItem[];
  syncStats: SyncStats | null;
  isProcessing: boolean;
  triggerSync: (negocioId: string, operation?: string, priority?: number) => Promise<string | undefined>;
  retryFailedItems: () => Promise<void>;
  loadSyncData: () => Promise<void>;
  processQueue: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

// Single instance to prevent multiple subscriptions
let syncProviderInstance: any = null;

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  console.log('[SyncProvider] Initializing centralized sync context');
  
  // Use singleton pattern to ensure only one instance
  if (!syncProviderInstance) {
    console.log('[SyncProvider] Creating new sync instance');
    syncProviderInstance = useReactiveHubSpotSync();
  } else {
    console.log('[SyncProvider] Reusing existing sync instance');
  }

  const syncData = syncProviderInstance;

  console.log('[SyncProvider] Sync data loaded:', {
    queueCount: syncData.syncQueue.length,
    isProcessing: syncData.isProcessing,
    stats: syncData.syncStats
  });

  return (
    <SyncContext.Provider value={syncData}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
