
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeSubscription = (
  loadSyncData: () => Promise<void>,
  processQueue: () => Promise<void>
) => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const channelRef = useRef<any>(null);
  const subscriptionActiveRef = useRef(false);

  // Clean up channel function
  const cleanupChannel = () => {
    if (channelRef.current && subscriptionActiveRef.current) {
      console.log('[useRealtimeSubscription] Cleaning up existing channel...');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('[useRealtimeSubscription] Error removing channel:', error);
      }
      channelRef.current = null;
      subscriptionActiveRef.current = false;
    }
  };

  // Listen to database notifications for real-time triggers
  useEffect(() => {
    // Skip if no user or config
    if (!user || !config?.api_key_set) {
      console.log('[useRealtimeSubscription] No user or API key not set, cleaning up subscription');
      cleanupChannel();
      return;
    }

    // Skip if already subscribed
    if (subscriptionActiveRef.current) {
      console.log('[useRealtimeSubscription] Already subscribed, skipping');
      return;
    }

    console.log('[useRealtimeSubscription] Setting up real-time sync listeners...');

    // Clean up any existing channel first
    cleanupChannel();

    // Create a unique channel name
    const channelName = `hubspot-sync-notifications-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'hubspot_sync_queue'
    }, (payload) => {
      // Safely access the id property with proper type checking
      const newRecord = payload.new as Record<string, any> | null;
      const recordId = newRecord?.id || 'unknown';
      
      console.log('[useRealtimeSubscription] Queue change detected:', payload.eventType, recordId);
      loadSyncData();
      
      // Process queue if new items were added
      if (payload.eventType === 'INSERT') {
        console.log('[useRealtimeSubscription] New queue item added, triggering processing');
        setTimeout(() => processQueue(), 1000);
      }
    }).subscribe((status) => {
      console.log(`[useRealtimeSubscription] Channel subscription status: ${status}`);
      if (status === 'SUBSCRIBED') {
        subscriptionActiveRef.current = true;
      } else if (status === 'CLOSED') {
        subscriptionActiveRef.current = false;
      }
    });

    return () => {
      console.log('[useRealtimeSubscription] Cleaning up sync listeners...');
      cleanupChannel();
    };
  }, [user?.id, config?.api_key_set, loadSyncData, processQueue]);

  return { cleanupChannel };
};
