
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

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  console.log('[SyncProvider] Initializing sync context');
  
  // Direct hook call - no singleton pattern
  const syncData = useReactiveHubSpotSync();

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
