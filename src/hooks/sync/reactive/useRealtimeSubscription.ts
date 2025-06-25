
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
  const isSubscribedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if no user or API key not configured
    if (!user || !config?.api_key_set) {
      console.log('[useRealtimeSubscription] Skipping - no user or API key not set');
      return;
    }

    // Check if user changed - if so, cleanup previous subscription
    if (userIdRef.current && userIdRef.current !== user.id) {
      console.log('[useRealtimeSubscription] User changed, cleaning up previous subscription');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
      }
    }

    // Prevent multiple subscriptions for the same user
    if (isSubscribedRef.current && userIdRef.current === user.id) {
      console.log('[useRealtimeSubscription] Already subscribed for this user, skipping');
      return;
    }

    console.log('[useRealtimeSubscription] Setting up subscription...');
    isSubscribedRef.current = true;
    userIdRef.current = user.id;

    const manager = RealtimeSubscriptionManager.getInstance();
    const callbacks = { loadSyncData, processQueue };
    
    // Create a new subscription - the manager will handle uniqueness
    unsubscribeRef.current = manager.subscribe(user.id, callbacks);

    return () => {
      console.log('[useRealtimeSubscription] Cleanup...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      isSubscribedRef.current = false;
      userIdRef.current = null;
    };
  }, [user?.id, config?.api_key_set, loadSyncData, processQueue]); // Include callback dependencies

  const cleanupChannel = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      isSubscribedRef.current = false;
      userIdRef.current = null;
    }
  };

  return { cleanupChannel };
};
