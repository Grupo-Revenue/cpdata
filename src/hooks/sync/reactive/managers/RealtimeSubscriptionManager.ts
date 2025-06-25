
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionCallbacks, ActiveSubscription } from '../types/subscription';

// Subscription manager that creates completely independent subscriptions
export class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private activeSubscriptions = new Map<string, ActiveSubscription>();
  private subscriptionCounter = 0;

  private constructor() {}

  static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  subscribe(userId: string, callbacks: SubscriptionCallbacks) {
    console.log(`[RealtimeSubscriptionManager] Subscribe request for user ${userId}`);
    
    // Create a unique subscription key for each subscription request
    this.subscriptionCounter++;
    const subscriptionKey = `${userId}-${this.subscriptionCounter}-${Date.now()}`;
    console.log(`[RealtimeSubscriptionManager] Using unique subscription key: ${subscriptionKey}`);
    
    // Always create a new subscription for each request
    console.log(`[RealtimeSubscriptionManager] Creating new independent subscription`);
    const subscription = this.createAndStartSubscription(userId, subscriptionKey);
    this.activeSubscriptions.set(subscriptionKey, subscription);
    
    // Add callbacks to the new subscription
    subscription.callbacks.add(callbacks);
    console.log(`[RealtimeSubscriptionManager] Added callbacks to new subscription`);
    
    return () => this.unsubscribe(subscriptionKey, callbacks);
  }

  private createAndStartSubscription(userId: string, subscriptionKey: string): ActiveSubscription {
    // Create a unique channel name to ensure we get a fresh channel instance
    const channelName = `hubspot-sync-${subscriptionKey}`;
    console.log(`[RealtimeSubscriptionManager] Creating fresh channel: ${channelName}`);
    
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

    // Start subscription immediately since we have a fresh channel
    subscription.isSubscribing = true;
    
    channel.subscribe((status: string) => {
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

    return subscription;
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

    // Always clean up the subscription since each one is independent
    console.log(`[RealtimeSubscriptionManager] Cleaning up independent subscription: ${subscriptionKey}`);
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
