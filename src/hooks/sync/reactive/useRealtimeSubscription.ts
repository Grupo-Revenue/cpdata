
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { supabase } from '@/integrations/supabase/client';

// Global subscription manager to ensure only one subscription per user
const subscriptionManager = {
  activeSubscriptions: new Map<string, any>(),
  subscribers: new Map<string, Set<string>>(),
  
  subscribe(userId: string, subscriberId: string, callbacks: any) {
    const channelName = `hubspot-sync-${userId}`;
    
    // Add this subscriber to the list
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(subscriberId);
    
    // If channel already exists, just add the callback
    if (this.activeSubscriptions.has(userId)) {
      console.log(`[useRealtimeSubscription] Reusing existing subscription for user ${userId}`);
      return this.activeSubscriptions.get(userId);
    }
    
    console.log(`[useRealtimeSubscription] Creating new subscription for user ${userId}`);
    
    // Create new channel
    const channel = supabase.channel(channelName);
    
    // Configure the channel
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'hubspot_sync_queue'
    }, (payload) => {
      const newRecord = payload.new as Record<string, any> | null;
      const recordId = newRecord?.id || 'unknown';
      
      console.log('[useRealtimeSubscription] Queue change detected:', payload.eventType, recordId);
      callbacks.loadSyncData();
      
      // Process queue if new items were added
      if (payload.eventType === 'INSERT') {
        console.log('[useRealtimeSubscription] New queue item added, triggering processing');
        setTimeout(() => callbacks.processQueue(), 1000);
      }
    });

    // Subscribe to the configured channel
    channel.subscribe((status) => {
      console.log(`[useRealtimeSubscription] Channel subscription status: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log('[useRealtimeSubscription] Successfully subscribed to channel');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.log('[useRealtimeSubscription] Channel subscription ended');
        // Clean up from manager
        this.activeSubscriptions.delete(userId);
      }
    });
    
    // Store the subscription
    this.activeSubscriptions.set(userId, channel);
    return channel;
  },
  
  unsubscribe(userId: string, subscriberId: string) {
    const subscribers = this.subscribers.get(userId);
    if (subscribers) {
      subscribers.delete(subscriberId);
      
      // If no more subscribers, clean up the channel
      if (subscribers.size === 0) {
        console.log(`[useRealtimeSubscription] Last subscriber removed, cleaning up channel for user ${userId}`);
        const channel = this.activeSubscriptions.get(userId);
        if (channel) {
          try {
            channel.unsubscribe();
            supabase.removeChannel(channel);
          } catch (error) {
            console.error('[useRealtimeSubscription] Error cleaning up channel:', error);
          }
        }
        this.activeSubscriptions.delete(userId);
        this.subscribers.delete(userId);
      }
    }
  }
};

export const useRealtimeSubscription = (
  loadSyncData: () => Promise<void>,
  processQueue: () => Promise<void>
) => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const subscriberIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));
  const isActiveRef = useRef(false);

  useEffect(() => {
    // Skip if no user or config
    if (!user || !config?.api_key_set) {
      console.log('[useRealtimeSubscription] No user or API key not set, skipping subscription');
      return;
    }

    // Skip if already active
    if (isActiveRef.current) {
      console.log('[useRealtimeSubscription] Already active, skipping');
      return;
    }

    console.log('[useRealtimeSubscription] Setting up real-time sync listeners...');
    isActiveRef.current = true;

    // Subscribe through the manager
    const channel = subscriptionManager.subscribe(user.id, subscriberIdRef.current, {
      loadSyncData,
      processQueue
    });

    return () => {
      console.log('[useRealtimeSubscription] Cleaning up sync listeners...');
      isActiveRef.current = false;
      subscriptionManager.unsubscribe(user.id, subscriberIdRef.current);
    };
  }, [user?.id, config?.api_key_set]); // Only depend on these stable values

  const cleanupChannel = () => {
    if (user) {
      subscriptionManager.unsubscribe(user.id, subscriberIdRef.current);
    }
  };

  return { cleanupChannel };
};
