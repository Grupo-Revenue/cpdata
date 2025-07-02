
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionCallbacks } from '../types/subscription';

// Completely refactored subscription manager to prevent multiple subscriptions
export class CentralizedSubscriptionManager {
  private static instance: CentralizedSubscriptionManager;
  private activeSubscriptions = new Map<string, {
    channel: any;
    callbacks: Set<SubscriptionCallbacks>;
    subscribed: boolean;
  }>();

  private constructor() {}

  static getInstance(): CentralizedSubscriptionManager {
    if (!CentralizedSubscriptionManager.instance) {
      CentralizedSubscriptionManager.instance = new CentralizedSubscriptionManager();
    }
    return CentralizedSubscriptionManager.instance;
  }

  async subscribe(userId: string, callbacks: SubscriptionCallbacks): Promise<() => void> {
    const channelKey = `hubspot-sync-${userId}`;
    console.log(`[CentralizedSubscriptionManager] Subscribe request for: ${channelKey}`);

    // Get or create subscription entry
    if (!this.activeSubscriptions.has(channelKey)) {
      console.log(`[CentralizedSubscriptionManager] Creating new subscription entry: ${channelKey}`);
      this.activeSubscriptions.set(channelKey, {
        channel: null,
        callbacks: new Set(),
        subscribed: false
      });
    }

    const subscription = this.activeSubscriptions.get(channelKey)!;
    
    // Add callbacks
    subscription.callbacks.add(callbacks);
    console.log(`[CentralizedSubscriptionManager] Added callbacks. Total: ${subscription.callbacks.size}`);

    // Create channel if it doesn't exist or isn't subscribed
    if (!subscription.channel || !subscription.subscribed) {
      await this.createChannel(channelKey, subscription);
    }

    // Return cleanup function
    return () => this.unsubscribe(channelKey, callbacks);
  }

  private async createChannel(channelKey: string, subscription: any): Promise<void> {
    console.log(`[CentralizedSubscriptionManager] Creating channel: ${channelKey}`);
    
    // Clean up existing channel if any
    if (subscription.channel) {
      try {
        subscription.channel.unsubscribe();
        supabase.removeChannel(subscription.channel);
      } catch (error) {
        console.error(`[CentralizedSubscriptionManager] Error cleaning up old channel:`, error);
      }
    }

    // Create new channel
    const channel = supabase.channel(channelKey);
    subscription.channel = channel;
    subscription.subscribed = false;

    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'hubspot_sync_queue'
    }, (payload) => {
      console.log(`[CentralizedSubscriptionManager] Queue change received:`, payload.eventType);
      
      // Notify all callbacks
      subscription.callbacks.forEach(callback => {
        try {
          callback.loadSyncData();
          
          if (payload.eventType === 'INSERT') {
            setTimeout(() => callback.processQueue(), 1000);
          }
        } catch (error) {
          console.error(`[CentralizedSubscriptionManager] Error calling callback:`, error);
        }
      });
    });

    // Subscribe only once
    try {
      const status = await new Promise<string>((resolve, reject) => {
        channel.subscribe((status: string) => {
          console.log(`[CentralizedSubscriptionManager] Channel ${channelKey} status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            subscription.subscribed = true;
            resolve(status);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            subscription.subscribed = false;
            if (status === 'CHANNEL_ERROR') {
              reject(new Error(`Channel subscription failed: ${channelKey}`));
            } else {
              resolve(status);
            }
          }
        });
      });

      console.log(`[CentralizedSubscriptionManager] Successfully subscribed to ${channelKey}`);
    } catch (error) {
      console.error(`[CentralizedSubscriptionManager] Failed to subscribe to ${channelKey}:`, error);
      subscription.subscribed = false;
    }
  }

  private unsubscribe(channelKey: string, callbacks: SubscriptionCallbacks): void {
    console.log(`[CentralizedSubscriptionManager] Unsubscribe request for ${channelKey}`);
    
    const subscription = this.activeSubscriptions.get(channelKey);
    if (!subscription) return;

    subscription.callbacks.delete(callbacks);
    console.log(`[CentralizedSubscriptionManager] Removed callbacks. Remaining: ${subscription.callbacks.size}`);

    // If no more callbacks, cleanup the channel
    if (subscription.callbacks.size === 0) {
      console.log(`[CentralizedSubscriptionManager] No more callbacks, cleaning up channel: ${channelKey}`);
      this.cleanupSubscription(channelKey);
    }
  }

  private cleanupSubscription(channelKey: string): void {
    const subscription = this.activeSubscriptions.get(channelKey);
    if (!subscription) return;

    if (subscription.channel && subscription.subscribed) {
      try {
        subscription.channel.unsubscribe();
        supabase.removeChannel(subscription.channel);
        console.log(`[CentralizedSubscriptionManager] Cleaned up channel: ${channelKey}`);
      } catch (error) {
        console.error(`[CentralizedSubscriptionManager] Error during cleanup:`, error);
      }
    }

    this.activeSubscriptions.delete(channelKey);
  }

  // Debug method
  getDebugInfo() {
    return {
      activeSubscriptions: Array.from(this.activeSubscriptions.keys()),
      subscriptionDetails: Array.from(this.activeSubscriptions.entries()).map(([key, sub]) => ({
        channel: key,
        callbackCount: sub.callbacks.size,
        subscribed: sub.subscribed,
        hasChannel: !!sub.channel
      }))
    };
  }
}
