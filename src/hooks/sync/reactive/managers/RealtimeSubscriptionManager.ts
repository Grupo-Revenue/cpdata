
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionCallbacks, ActiveSubscription } from '../types/subscription';

// Simple subscription manager that creates unique channels for each subscription
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
    
    // Always create a new unique subscription to prevent any conflicts
    const subscriptionKey = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[RealtimeSubscriptionManager] Creating new subscription: ${subscriptionKey}`);
    
    const subscription = this.createSubscription(userId, subscriptionKey);
    subscription.callbacks.add(callbacks);
    this.activeSubscriptions.set(subscriptionKey, subscription);
    
    // Start the subscription immediately
    this.startSubscription(subscriptionKey, subscription);
    
    return () => this.unsubscribe(subscriptionKey, callbacks);
  }

  private createSubscription(userId: string, subscriptionKey: string): ActiveSubscription {
    // Create a unique channel name that includes the subscription key
    const channelName = `hubspot-sync-${subscriptionKey}`;
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

    // Always clean up the subscription when callbacks are removed
    console.log(`[RealtimeSubscriptionManager] Cleaning up subscription: ${subscriptionKey}`);
    this.cleanupSubscription(subscriptionKey);
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
