
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
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Skip if no user, API key not configured, or already initialized
    if (!user || !config?.api_key_set || isInitializedRef.current) {
      console.log('[useRealtimeSubscription] Skipping subscription:', {
        hasUser: !!user,
        apiKeySet: config?.api_key_set,
        initialized: isInitializedRef.current
      });
      return;
    }

    console.log('[useRealtimeSubscription] Setting up subscription for user:', user.id);
    isInitializedRef.current = true;

    const manager = CentralizedSubscriptionManager.getInstance();
    const callbacks = { loadSyncData, processQueue };
    
    // Subscribe
    manager.subscribe(user.id, callbacks)
      .then(unsubscribeFn => {
        unsubscribeRef.current = unsubscribeFn;
        console.log('[useRealtimeSubscription] Successfully subscribed');
      })
      .catch(error => {
        console.error('[useRealtimeSubscription] Subscription failed:', error);
        isInitializedRef.current = false;
      });

    return () => {
      console.log('[useRealtimeSubscription] Cleanup...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [user?.id, config?.api_key_set, loadSyncData, processQueue]);

  return {};
};
