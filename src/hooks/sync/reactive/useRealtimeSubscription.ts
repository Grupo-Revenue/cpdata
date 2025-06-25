
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { supabase } from '@/integrations/supabase/client';

// Global callback coordinator to manage multiple subscriptions
const callbackCoordinator = {
  callbacks: new Map<string, any>(),
  activeSubscriptions: new Set<string>(),
  
  register(userId: string, subscriberId: string, callbacks: any) {
    const key = `${userId}-${subscriberId}`;
    this.callbacks.set(key, callbacks);
    console.log(`[useRealtimeSubscription] Registered callbacks for ${key}`);
  },
  
  unregister(userId: string, subscriberId: string) {
    const key = `${userId}-${subscriberId}`;
    this.callbacks.delete(key);
    console.log(`[useRealtimeSubscription] Unregistered callbacks for ${key}`);
  },
  
  handleChange(userId: string, payload: any) {
    console.log(`[useRealtimeSubscription] Processing change for user ${userId}:`, payload.eventType);
    
    // Call all registered callbacks for this user
    for (const [key, callbacks] of this.callbacks.entries()) {
      if (key.startsWith(`${userId}-`)) {
        try {
          callbacks.loadSyncData();
          
          // Process queue if new items were added
          if (payload.eventType === 'INSERT') {
            console.log('[useRealtimeSubscription] New queue item added, triggering processing');
            setTimeout(() => callbacks.processQueue(), 1000);
          }
        } catch (error) {
          console.error(`[useRealtimeSubscription] Error calling callbacks for ${key}:`, error);
        }
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
  const channelRef = useRef<any>(null);
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

    // Register callbacks with coordinator
    callbackCoordinator.register(user.id, subscriberIdRef.current, {
      loadSyncData,
      processQueue
    });

    // Create a unique channel for this subscription
    const channelName = `hubspot-sync-${user.id}-${subscriberIdRef.current}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // Configure the channel
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'hubspot_sync_queue'
    }, (payload) => {
      const newRecord = payload.new as Record<string, any> | null;
      const recordId = newRecord?.id || 'unknown';
      
      console.log('[useRealtimeSubscription] Queue change detected:', payload.eventType, recordId);
      
      // Use coordinator to handle the change
      callbackCoordinator.handleChange(user.id, payload);
    });

    // Subscribe to the channel (each channel instance can only subscribe once)
    channel.subscribe((status) => {
      console.log(`[useRealtimeSubscription] Channel subscription status: ${status} for ${channelName}`);
      if (status === 'SUBSCRIBED') {
        console.log('[useRealtimeSubscription] Successfully subscribed to channel');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.log('[useRealtimeSubscription] Channel subscription ended');
      }
    });

    return () => {
      console.log('[useRealtimeSubscription] Cleaning up sync listeners...');
      isActiveRef.current = false;
      
      // Unregister from coordinator
      callbackCoordinator.unregister(user.id, subscriberIdRef.current);
      
      // Clean up channel
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (error) {
          console.error('[useRealtimeSubscription] Error cleaning up channel:', error);
        }
      }
    };
  }, [user?.id, config?.api_key_set, loadSyncData, processQueue]);

  const cleanupChannel = () => {
    if (channelRef.current && user) {
      callbackCoordinator.unregister(user.id, subscriberIdRef.current);
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      } catch (error) {
        console.error('[useRealtimeSubscription] Error in manual cleanup:', error);
      }
    }
  };

  return { cleanupChannel };
};
