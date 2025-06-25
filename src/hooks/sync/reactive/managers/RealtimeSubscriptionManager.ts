
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionCallbacks, ActiveSubscription } from '../types/subscription';

// Simplified subscription manager for centralized sync context
export class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private activeSubscription: ActiveSubscription | null = null;
  private callbacksSet = new Set<SubscriptionCallbacks>();

  private constructor() {}

  static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  subscribe(userId: string, callbacks: SubscriptionCallbacks) {
    console.log(`[RealtimeSubscriptionManager] Subscribe request for user ${userId}`);
    
    // Add callbacks to the set
    this.callbacksSet.add(callbacks);
    console.log(`[RealtimeSubscriptionManager] Added callbacks. Total: ${this.callbacksSet.size}`);
    
    // Create subscription only if it doesn't exist
    if (!this.activeSubscription) {
      console.log(`[RealtimeSubscriptionManager] Creating new subscription`);
      this.activeSubscription = this.createAndStartSubscription(userId);
    } else {
      console.log(`[RealtimeSubscriptionManager] Reusing existing subscription`);
    }
    
    return () => this.unsubscribe(callbacks);
  }

  private createAndStartSubscription(userId: string): ActiveSubscription {
    const channelName = `hubspot-sync-${userId}`;
    console.log(`[RealtimeSubscriptionManager] Creating channel: ${channelName}`);
    
    const channel = supabase.channel(channelName);
    
    const subscription: ActiveSubscription = {
      channel,
      callbacks: new Set<SubscriptionCallbacks>(),
      isSubscribed: false,
      isSubscribing: false
    };

    // Configure the channel
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'hubspot_sync_queue'
    }, (payload) => {
      const newRecord = payload.new as Record<string, any> | null;
      const recordId = newRecord?.id || 'unknown';
      
      console.log(`[RealtimeSubscriptionManager] Queue change:`, payload.eventType, recordId);
      
      // Call all registered callbacks
      this.callbacksSet.forEach(callbacks => {
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

    // Start subscription
    subscription.isSubscribing = true;
    
    channel.subscribe((status: string) => {
      console.log(`[RealtimeSubscriptionManager] Channel status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        subscription.isSubscribed = true;
        subscription.isSubscribing = false;
        console.log(`[RealtimeSubscriptionManager] Successfully subscribed`);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        subscription.isSubscribed = false;
        subscription.isSubscribing = false;
        console.log(`[RealtimeSubscriptionManager] Channel ended`);
      }
    });

    return subscription;
  }

  private unsubscribe(callbacks: SubscriptionCallbacks) {
    console.log(`[RealtimeSubscriptionManager] Unsubscribe request`);
    
    this.callbacksSet.delete(callbacks);
    console.log(`[RealtimeSubscriptionManager] Removed callbacks. Remaining: ${this.callbacksSet.size}`);

    // If no more callbacks, cleanup the subscription
    if (this.callbacksSet.size === 0 && this.activeSubscription) {
      console.log(`[RealtimeSubscriptionManager] No more callbacks, cleaning up subscription`);
      this.cleanupSubscription();
    }
  }

  private cleanupSubscription() {
    if (!this.activeSubscription) return;

    try {
      if (this.activeSubscription.isSubscribed || this.activeSubscription.isSubscribing) {
        this.activeSubscription.channel.unsubscribe();
        console.log(`[RealtimeSubscriptionManager] Unsubscribed channel`);
      }
      supabase.removeChannel(this.activeSubscription.channel);
      console.log(`[RealtimeSubscriptionManager] Removed channel`);
    } catch (error) {
      console.error(`[RealtimeSubscriptionManager] Error during cleanup:`, error);
    }

    this.activeSubscription = null;
  }

  // Debug method
  getActiveSubscription() {
    return {
      hasSubscription: !!this.activeSubscription,
      callbacksCount: this.callbacksSet.size,
      isSubscribed: this.activeSubscription?.isSubscribed || false
    };
  }
}
