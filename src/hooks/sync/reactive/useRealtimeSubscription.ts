
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { supabase } from '@/integrations/supabase/client';

// Simple subscription manager that prevents multiple subscriptions
class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private activeSubscriptions = new Map<string, {
    channel: any;
    callbacks: Set<any>;
    isSubscribed: boolean;
    isSubscribing: boolean;
  }>();

  private constructor() {}

  static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  subscribe(userId: string, callbacks: any) {
    console.log(`[RealtimeSubscriptionManager] Subscribe request for user ${userId}`);
    
    let subscription = this.activeSubscriptions.get(userId);
    
    if (!subscription) {
      console.log(`[RealtimeSubscriptionManager] Creating new subscription for user ${userId}`);
      subscription = this.createSubscription(userId);
      this.activeSubscriptions.set(userId, subscription);
    }

    // Add callbacks to existing subscription
    subscription.callbacks.add(callbacks);
    console.log(`[RealtimeSubscriptionManager] Added callbacks for user ${userId}. Total: ${subscription.callbacks.size}`);
    
    // Start subscription if not already subscribed or subscribing
    if (!subscription.isSubscribed && !subscription.isSubscribing) {
      this.startSubscription(userId, subscription);
    }
    
    return () => this.unsubscribe(userId, callbacks);
  }

  private createSubscription(userId: string) {
    const channelName = `hubspot-sync-${userId}-${Date.now()}`;
    console.log(`[RealtimeSubscriptionManager] Creating channel: ${channelName}`);
    
    const channel = supabase.channel(channelName);
    
    const subscription = {
      channel,
      callbacks: new Set<any>(),
      isSubscribed: false,
      isSubscribing: false
    };

    // Configure the channel BEFORE subscribing
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'hubspot_sync_queue'
    }, (payload) => {
      const newRecord = payload.new as Record<string, any> | null;
      const recordId = newRecord?.id || 'unknown';
      
      console.log(`[RealtimeSubscriptionManager] Queue change for user ${userId}:`, payload.eventType, recordId);
      
      // Call all registered callbacks
      subscription.callbacks.forEach(callbacks => {
        try {
          callbacks.loadSyncData();
          
          if (payload.eventType === 'INSERT') {
            console.log('[RealtimeSubscriptionManager] New queue item, triggering processing');
            setTimeout(() => callbacks.processQueue(), 1000);
          }
        } catch (error) {
          console.error(`[RealtimeSubscriptionManager] Error calling callbacks:`, error);
        }
      });
    });

    return subscription;
  }

  private startSubscription(userId: string, subscription: any) {
    if (subscription.isSubscribing || subscription.isSubscribed) {
      console.log(`[RealtimeSubscriptionManager] Subscription already in progress or active for user ${userId}`);
      return;
    }

    console.log(`[RealtimeSubscriptionManager] Starting subscription for user ${userId}`);
    subscription.isSubscribing = true;

    // Subscribe to the channel only once
    subscription.channel.subscribe((status: string) => {
      console.log(`[RealtimeSubscriptionManager] Channel status: ${status} for user ${userId}`);
      
      if (status === 'SUBSCRIBED') {
        subscription.isSubscribed = true;
        subscription.isSubscribing = false;
        console.log(`[RealtimeSubscriptionManager] Successfully subscribed for user ${userId}`);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        subscription.isSubscribed = false;
        subscription.isSubscribing = false;
        console.log(`[RealtimeSubscriptionManager] Channel ended for user ${userId}`);
      }
    });
  }

  private unsubscribe(userId: string, callbacks: any) {
    console.log(`[RealtimeSubscriptionManager] Unsubscribe request for user ${userId}`);
    
    const subscription = this.activeSubscriptions.get(userId);
    if (!subscription) {
      console.log(`[RealtimeSubscriptionManager] No subscription found for user ${userId}`);
      return;
    }

    subscription.callbacks.delete(callbacks);
    console.log(`[RealtimeSubscriptionManager] Removed callbacks for user ${userId}. Remaining: ${subscription.callbacks.size}`);

    // Clean up if no more callbacks
    if (subscription.callbacks.size === 0) {
      console.log(`[RealtimeSubscriptionManager] Cleaning up subscription for user ${userId}`);
      this.cleanupSubscription(userId);
    }
  }

  private cleanupSubscription(userId: string) {
    const subscription = this.activeSubscriptions.get(userId);
    if (!subscription) return;

    try {
      if (subscription.isSubscribed) {
        subscription.channel.unsubscribe();
        console.log(`[RealtimeSubscriptionManager] Unsubscribed channel for user ${userId}`);
      }
      supabase.removeChannel(subscription.channel);
      console.log(`[RealtimeSubscriptionManager] Removed channel for user ${userId}`);
    } catch (error) {
      console.error(`[RealtimeSubscriptionManager] Error during cleanup for user ${userId}:`, error);
    }

    this.activeSubscriptions.delete(userId);
  }

  // Debug method to check active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.activeSubscriptions.keys());
  }
}

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
