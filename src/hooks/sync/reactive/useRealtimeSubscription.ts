
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
  const hasSetupSubscription = useRef(false);

  useEffect(() => {
    // Skip if no user or API key not configured
    if (!user || !config?.api_key_set) {
      console.log('[useRealtimeSubscription] Skipping - no user or API key not set');
      return;
    }

    // Prevent multiple subscriptions from the same hook instance
    if (hasSetupSubscription.current) {
      console.log('[useRealtimeSubscription] Already set up subscription, skipping');
      return;
    }

    console.log('[useRealtimeSubscription] Setting up subscription...');
    hasSetupSubscription.current = true;

    const manager = RealtimeSubscriptionManager.getInstance();
    const callbacks = { loadSyncData, processQueue };
    
    unsubscribeRef.current = manager.subscribe(user.id, callbacks);

    return () => {
      console.log('[useRealtimeSubscription] Cleanup...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      hasSetupSubscription.current = false;
    };
  }, [user?.id, config?.api_key_set]); // Only depend on stable values

  const cleanupChannel = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      hasSetupSubscription.current = false;
    }
  };

  return { cleanupChannel };
};
