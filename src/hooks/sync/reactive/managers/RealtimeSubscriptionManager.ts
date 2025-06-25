
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionCallbacks, ActiveSubscription } from '../types/subscription';

// Subscription manager that shares one channel per user and manages multiple callbacks
export class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private activeSubscriptions = new Map<string, ActiveSubscription>();

  private constructor() {}

  static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  subscribe(userId: string, callbacks: SubscriptionCallbacks) {
    console.log(`[RealtimeSubscriptionManager] Subscribe request for user ${userId}`);
    
    // Use userId as the subscription key to share one channel per user
    const subscriptionKey = userId;
    console.log(`[RealtimeSubscriptionManager] Using subscription key: ${subscriptionKey}`);
    
    let subscription = this.activeSubscriptions.get(subscriptionKey);
    
    if (!subscription) {
      // Create new subscription only if it doesn't exist
      console.log(`[RealtimeSubscriptionManager] Creating new subscription for user ${userId}`);
      subscription = this.createSubscription(userId, subscriptionKey);
      this.activeSubscriptions.set(subscriptionKey, subscription);
      
      // Start the subscription immediately
      this.startSubscription(subscriptionKey, subscription);
    } else {
      console.log(`[RealtimeSubscriptionManager] Reusing existing subscription for user ${userId}`);
    }
    
    // Add callbacks to the existing or new subscription
    subscription.callbacks.add(callbacks);
    console.log(`[RealtimeSubscriptionManager] Added callbacks. Total callbacks: ${subscription.callbacks.size}`);
    
    return () => this.unsubscribe(subscriptionKey, callbacks);
  }

  private createSubscription(userId: string, subscriptionKey: string): ActiveSubscription {
    // Create a channel name based on the user to ensure uniqueness
    const channelName = `hubspot-sync-${userId}`;
    console.log(`[RealtimeSubscriptionManager] Creating channel: ${channelName}`);
    
    const channel = supabase.channel(channelName);
    
    const subscription: ActiveSubscription = {
      channel,
      callbacks: new Set<SubscriptionCallbacks>(),
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

  private startSubscription(subscriptionKey: string, subscription: ActiveSubscription) {
    console.log(`[RealtimeSubscriptionManager] Starting subscription: ${subscriptionKey}`);
    
    // Check if already subscribing or subscribed to prevent multiple calls
    if (subscription.isSubscribing || subscription.isSubscribed) {
      console.log(`[RealtimeSubscriptionManager] Subscription already active for ${subscriptionKey}`);
      return;
    }

    // Mark as subscribing to prevent double subscription
    subscription.isSubscribing = true;

    // Subscribe to the channel - this should only happen once per channel instance
    subscription.channel.subscribe((status: string) => {
      console.log(`[RealtimeSubscriptionManager] Channel status: ${status} for subscription ${subscriptionKey}`);
      
      if (status === 'SUBSCRIBED') {
        subscription.isSubscribed = true;
        subscription.isSubscribing = false;
        console.log(`[RealtimeSubscriptionManager] Successfully subscribed: ${subscriptionKey}`);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        subscription.isSubscribed = false;
        subscription.isSubscribing = false;
        console.log(`[RealtimeSubscriptionManager] Channel ended for subscription ${subscriptionKey}`);
      }
    });
  }

  private unsubscribe(subscriptionKey: string, callbacks: SubscriptionCallbacks) {
    console.log(`[RealtimeSubscriptionManager] Unsubscribe request for subscription ${subscriptionKey}`);
    
    const subscription = this.activeSubscriptions.get(subscriptionKey);
    if (!subscription) {
      console.log(`[RealtimeSubscriptionManager] No subscription found: ${subscriptionKey}`);
      return;
    }

    subscription.callbacks.delete(callbacks);
    console.log(`[RealtimeSubscriptionManager] Removed callbacks for ${subscriptionKey}. Remaining: ${subscription.callbacks.size}`);

    // Only clean up the subscription if no more callbacks are registered
    if (subscription.callbacks.size === 0) {
      console.log(`[RealtimeSubscriptionManager] No more callbacks, cleaning up subscription: ${subscriptionKey}`);
      this.cleanupSubscription(subscriptionKey);
    }
  }

  private cleanupSubscription(subscriptionKey: string) {
    const subscription = this.activeSubscriptions.get(subscriptionKey);
    if (!subscription) return;

    try {
      if (subscription.isSubscribed || subscription.isSubscribing) {
        subscription.channel.unsubscribe();
        console.log(`[RealtimeSubscriptionManager] Unsubscribed channel for ${subscriptionKey}`);
      }
      supabase.removeChannel(subscription.channel);
      console.log(`[RealtimeSubscriptionManager] Removed channel for ${subscriptionKey}`);
    } catch (error) {
      console.error(`[RealtimeSubscriptionManager] Error during cleanup for ${subscriptionKey}:`, error);
    }

    this.activeSubscriptions.delete(subscriptionKey);
  }

  // Debug method to check active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.activeSubscriptions.keys());
  }
}
