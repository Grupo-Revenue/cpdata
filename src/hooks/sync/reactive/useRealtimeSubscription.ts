
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
  const isSettingUpRef = useRef(false);

  // Clean up channel function - made synchronous
  const cleanupChannel = () => {
    if (channelRef.current) {
      console.log('[useRealtimeSubscription] Cleaning up existing channel...');
      
      try {
        // Always unsubscribe first
        if (subscriptionActiveRef.current) {
          channelRef.current.unsubscribe();
          subscriptionActiveRef.current = false;
        }
        
        // Remove the channel
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        
        console.log('[useRealtimeSubscription] Channel cleanup completed');
      } catch (error) {
        console.error('[useRealtimeSubscription] Error cleaning up channel:', error);
        // Force reset references even if cleanup failed
        channelRef.current = null;
        subscriptionActiveRef.current = false;
      }
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

    // Skip if already setting up to prevent race conditions
    if (isSettingUpRef.current) {
      console.log('[useRealtimeSubscription] Setup already in progress, skipping');
      return;
    }

    // Skip if already subscribed to the same user
    if (subscriptionActiveRef.current && channelRef.current) {
      console.log('[useRealtimeSubscription] Already subscribed for this user, skipping');
      return;
    }

    console.log('[useRealtimeSubscription] Setting up real-time sync listeners...');
    isSettingUpRef.current = true;

    // Clean up any existing channel first (synchronous)
    cleanupChannel();

    try {
      // Create a unique channel name with user ID
      const channelName = `hubspot-sync-${user.id}`;
      const channel = supabase.channel(channelName);
      
      // Store reference immediately
      channelRef.current = channel;

      // Configure the channel
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
      });

      // Subscribe to the configured channel
      channel.subscribe((status) => {
        console.log(`[useRealtimeSubscription] Channel subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          subscriptionActiveRef.current = true;
          console.log('[useRealtimeSubscription] Successfully subscribed to channel');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          subscriptionActiveRef.current = false;
          console.log('[useRealtimeSubscription] Channel subscription ended');
        }
        
        // Mark setup as complete
        isSettingUpRef.current = false;
      });

    } catch (error) {
      console.error('[useRealtimeSubscription] Error setting up subscription:', error);
      isSettingUpRef.current = false;
      cleanupChannel();
    }

    return () => {
      console.log('[useRealtimeSubscription] Cleaning up sync listeners...');
      isSettingUpRef.current = false;
      cleanupChannel();
    };
  }, [user?.id, config?.api_key_set]); // Only depend on these stable values

  return { cleanupChannel };
};
