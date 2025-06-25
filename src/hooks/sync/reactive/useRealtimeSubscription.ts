
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { CentralizedSubscriptionManager } from './managers/CentralizedSubscriptionManager';

export const useRealtimeSubscription = (
  loadSyncData: () => Promise<void>,
  processQueue: () => Promise<void>
) => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Skip if no user or API key not configured
    if (!user || !config?.api_key_set) {
      console.log('[useRealtimeSubscription] Skipping - no user or API key not set');
      return;
    }

    // Prevent double subscription
    if (isSubscribedRef.current) {
      console.log('[useRealtimeSubscription] Already subscribed, skipping');
      return;
    }

    console.log('[useRealtimeSubscription] Setting up subscription for user:', user.id);

    const manager = CentralizedSubscriptionManager.getInstance();
    const callbacks = { loadSyncData, processQueue };
    
    // Subscribe using centralized manager
    manager.subscribe(user.id, callbacks)
      .then(unsubscribeFn => {
        unsubscribeRef.current = unsubscribeFn;
        isSubscribedRef.current = true;
        console.log('[useRealtimeSubscription] Successfully subscribed');
      })
      .catch(error => {
        console.error('[useRealtimeSubscription] Subscription failed:', error);
      });

    return () => {
      console.log('[useRealtimeSubscription] Cleanup...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, [user?.id, config?.api_key_set, loadSyncData, processQueue]);

  const cleanupChannel = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  return { cleanupChannel };
};
