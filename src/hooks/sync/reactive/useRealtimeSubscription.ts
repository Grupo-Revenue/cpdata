
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
  const isCleaningUpRef = useRef(false);

  // Clean up channel function
  const cleanupChannel = () => {
    if (isCleaningUpRef.current) {
      console.log('[useRealtimeSubscription] Cleanup already in progress, skipping');
      return;
    }

    if (channelRef.current) {
      console.log('[useRealtimeSubscription] Cleaning up existing channel...');
      isCleaningUpRef.current = true;
      
      try {
        // Always try to unsubscribe first, then remove
        if (subscriptionActiveRef.current) {
          channelRef.current.unsubscribe();
          subscriptionActiveRef.current = false;
        }
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      } catch (error) {
        console.error('[useRealtimeSubscription] Error cleaning up channel:', error);
      } finally {
        isCleaningUpRef.current = false;
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

    // Skip if already subscribed to prevent multiple subscriptions
    if (subscriptionActiveRef.current && channelRef.current) {
      console.log('[useRealtimeSubscription] Already subscribed, skipping');
      return;
    }

    // Skip if currently cleaning up
    if (isCleaningUpRef.current) {
      console.log('[useRealtimeSubscription] Cleanup in progress, skipping setup');
      return;
    }

    console.log('[useRealtimeSubscription] Setting up real-time sync listeners...');

    // Clean up any existing channel first
    cleanupChannel();

    // Create a unique channel name with user ID to avoid conflicts
    const channelName = `hubspot-sync-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelName);
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
    });

    return () => {
      console.log('[useRealtimeSubscription] Cleaning up sync listeners...');
      cleanupChannel();
    };
  }, [user?.id, config?.api_key_set]); // Removed loadSyncData and processQueue from dependencies

  return { cleanupChannel };
};
