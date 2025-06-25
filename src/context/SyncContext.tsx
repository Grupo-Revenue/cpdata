
import React, { createContext, useContext, ReactNode } from 'react';
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
  console.log('[SyncProvider] Initializing with simplified sync context (no realtime subscriptions)');
  
  // Simplified sync context without realtime subscriptions
  const mockSyncData: SyncContextType = {
    syncQueue: [],
    syncStats: null,
    isProcessing: false,
    triggerSync: async (negocioId: string, operation?: string, priority?: number) => {
      console.log('[SyncProvider] Mock triggerSync called:', { negocioId, operation, priority });
      return Promise.resolve(undefined);
    },
    retryFailedItems: async () => {
      console.log('[SyncProvider] Mock retryFailedItems called');
      return Promise.resolve();
    },
    loadSyncData: async () => {
      console.log('[SyncProvider] Mock loadSyncData called');
      return Promise.resolve();
    },
    processQueue: async () => {
      console.log('[SyncProvider] Mock processQueue called');
      return Promise.resolve();
    }
  };

  return (
    <SyncContext.Provider value={mockSyncData}>
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
