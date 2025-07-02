
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';

export const useRealtimeSubscription = (
  loadSyncData: () => Promise<void>,
  processQueue: () => Promise<void>
) => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // TEMPORARILY DISABLED - Realtime subscriptions causing navigation issues
    console.log('[useRealtimeSubscription] Realtime subscriptions temporarily disabled for debugging');
    console.log('[useRealtimeSubscription] User:', user?.id, 'Config:', config?.api_key_set);
    
    // Skip all subscription logic for now
    return () => {
      console.log('[useRealtimeSubscription] Cleanup (no-op)');
    };
  }, [user?.id, config?.api_key_set, loadSyncData, processQueue]);

  return {};
};
