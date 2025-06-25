
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { RealtimeSubscriptionManager } from './managers/RealtimeSubscriptionManager';

export const useRealtimeSubscription = (
  loadSyncData: () => Promise<void>,
  processQueue: () => Promise<void>
) => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Skip if no user or API key not configured
    if (!user || !config?.api_key_set) {
      console.log('[useRealtimeSubscription] Skipping - no user or API key not set');
      return;
    }

    console.log('[useRealtimeSubscription] Setting up subscription for user:', user.id);

    const manager = RealtimeSubscriptionManager.getInstance();
    const callbacks = { loadSyncData, processQueue };
    
    // Subscribe - the manager will handle sharing channels and managing callbacks
    unsubscribeRef.current = manager.subscribe(user.id, callbacks);

    return () => {
      console.log('[useRealtimeSubscription] Cleanup...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id, config?.api_key_set, loadSyncData, processQueue]);

  const cleanupChannel = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  };

  return { cleanupChannel };
};
