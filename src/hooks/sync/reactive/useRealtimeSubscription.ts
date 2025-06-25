
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { supabase } from '@/integrations/supabase/client';

// Global subscription manager - true singleton
class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions = new Map<string, {
    channel: any;
    callbacks: Set<any>;
    isActive: boolean;
  }>();

  private constructor() {}

  static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  subscribe(userId: string, callbacks: any) {
    console.log(`[RealtimeSubscriptionManager] Subscribing for user ${userId}`);
    
    if (!this.subscriptions.has(userId)) {
      console.log(`[RealtimeSubscriptionManager] Creating new subscription for user ${userId}`);
      this.createSubscription(userId);
    }

    const subscription = this.subscriptions.get(userId)!;
    subscription.callbacks.add(callbacks);
    console.log(`[RealtimeSubscriptionManager] Added callbacks for user ${userId}. Total callbacks: ${subscription.callbacks.size}`);
    
    return () => this.unsubscribe(userId, callbacks);
  }

  private createSubscription(userId: string) {
    const channelName = `hubspot-sync-${userId}`;
    const channel = supabase.channel(channelName);

    const subscription = {
      channel,
      callbacks: new Set<any>(),
      isActive: false
    };

    this.subscriptions.set(userId, subscription);

    // Configure the channel
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'hubspot_sync_queue'
    }, (payload) => {
      const newRecord = payload.new as Record<string, any> | null;
      const recordId = newRecord?.id || 'unknown';
      
      console.log(`[RealtimeSubscriptionManager] Queue change detected for user ${userId}:`, payload.eventType, recordId);
      
      // Call all registered callbacks for this user
      subscription.callbacks.forEach(callbacks => {
        try {
          callbacks.loadSyncData();
          
          // Process queue if new items were added
          if (payload.eventType === 'INSERT') {
            console.log('[RealtimeSubscriptionManager] New queue item added, triggering processing');
            setTimeout(() => callbacks.processQueue(), 1000);
          }
        } catch (error) {
          console.error(`[RealtimeSubscriptionManager] Error calling callbacks:`, error);
        }
      });
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`[RealtimeSubscriptionManager] Channel subscription status: ${status} for user ${userId}`);
      if (status === 'SUBSCRIBED') {
        subscription.isActive = true;
        console.log(`[RealtimeSubscriptionManager] Successfully subscribed for user ${userId}`);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        subscription.isActive = false;
        console.log(`[RealtimeSubscriptionManager] Channel subscription ended for user ${userId}`);
      }
    });
  }

  private unsubscribe(userId: string, callbacks: any) {
    console.log(`[RealtimeSubscriptionManager] Unsubscribing callbacks for user ${userId}`);
    
    const subscription = this.subscriptions.get(userId);
    if (!subscription) return;

    subscription.callbacks.delete(callbacks);
    console.log(`[RealtimeSubscriptionManager] Removed callbacks for user ${userId}. Remaining callbacks: ${subscription.callbacks.size}`);

    // If no more callbacks, clean up the subscription
    if (subscription.callbacks.size === 0) {
      console.log(`[RealtimeSubscriptionManager] No more callbacks for user ${userId}, cleaning up subscription`);
      this.cleanupSubscription(userId);
    }
  }

  private cleanupSubscription(userId: string) {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) return;

    try {
      subscription.channel.unsubscribe();
      supabase.removeChannel(subscription.channel);
      console.log(`[RealtimeSubscriptionManager] Cleaned up channel for user ${userId}`);
    } catch (error) {
      console.error(`[RealtimeSubscriptionManager] Error cleaning up channel for user ${userId}:`, error);
    }

    this.subscriptions.delete(userId);
  }

  // Force cleanup all subscriptions (useful for debugging)
  cleanup() {
    console.log('[RealtimeSubscriptionManager] Force cleaning up all subscriptions');
    for (const userId of this.subscriptions.keys()) {
      this.cleanupSubscription(userId);
    }
  }
}

export const useRealtimeSubscription = (
  loadSyncData: () => Promise<void>,
  processQueue: () => Promise<void>
) => {
  const { user } = useAuth();
  const { config } = useHubSpotConfig();
  const managerRef = useRef<RealtimeSubscriptionManager>();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Skip if no user or config
    if (!user || !config?.api_key_set) {
      console.log('[useRealtimeSubscription] No user or API key not set, skipping subscription');
      return;
    }

    console.log('[useRealtimeSubscription] Setting up real-time sync listeners...');

    // Get singleton manager
    if (!managerRef.current) {
      managerRef.current = RealtimeSubscriptionManager.getInstance();
    }

    // Subscribe with callbacks
    const callbacks = { loadSyncData, processQueue };
    unsubscribeRef.current = managerRef.current.subscribe(user.id, callbacks);

    return () => {
      console.log('[useRealtimeSubscription] Cleaning up sync listeners...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id, config?.api_key_set]); // Only depend on user ID and API key status

  const cleanupChannel = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  };

  return { cleanupChannel };
};
