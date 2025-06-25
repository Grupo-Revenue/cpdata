
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionCallbacks } from '../types/subscription';

// Centralized subscription manager to prevent multiple subscription errors
export class CentralizedSubscriptionManager {
  private static instance: CentralizedSubscriptionManager;
  private activeChannels = new Map<string, any>();
  private callbacksMap = new Map<string, Set<SubscriptionCallbacks>>();
  private subscriptionPromises = new Map<string, Promise<void>>();

  private constructor() {}

  static getInstance(): CentralizedSubscriptionManager {
    if (!CentralizedSubscriptionManager.instance) {
      CentralizedSubscriptionManager.instance = new CentralizedSubscriptionManager();
    }
    return CentralizedSubscriptionManager.instance;
  }

  async subscribe(userId: string, callbacks: SubscriptionCallbacks): Promise<() => void> {
    const channelKey = `hubspot-sync-${userId}`;
    console.log(`[CentralizedSubscriptionManager] Subscribe request for channel: ${channelKey}`);

    // Add callbacks to the map
    if (!this.callbacksMap.has(channelKey)) {
      this.callbacksMap.set(channelKey, new Set());
    }
    this.callbacksMap.get(channelKey)!.add(callbacks);

    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      console.log(`[CentralizedSubscriptionManager] Creating new channel: ${channelKey}`);
      await this.createChannel(channelKey, userId);
    } else {
      console.log(`[CentralizedSubscriptionManager] Reusing existing channel: ${channelKey}`);
    }

    // Return cleanup function
    return () => this.unsubscribe(channelKey, callbacks);
  }

  private async createChannel(channelKey: string, userId: string): Promise<void> {
    // Prevent concurrent channel creation
    if (this.subscriptionPromises.has(channelKey)) {
      console.log(`[CentralizedSubscriptionManager] Waiting for existing channel creation: ${channelKey}`);
      await this.subscriptionPromises.get(channelKey);
      return;
    }

    const subscriptionPromise = this.doCreateChannel(channelKey, userId);
    this.subscriptionPromises.set(channelKey, subscriptionPromise);

    try {
      await subscriptionPromise;
    } finally {
      this.subscriptionPromises.delete(channelKey);
    }
  }

  private async doCreateChannel(channelKey: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[CentralizedSubscriptionManager] Setting up channel: ${channelKey}`);
      
      const channel = supabase.channel(channelKey);
      
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hubspot_sync_queue'
      }, (payload) => {
        console.log(`[CentralizedSubscriptionManager] Queue change received:`, payload.eventType);
        
        // Notify all registered callbacks
        const callbacks = this.callbacksMap.get(channelKey);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback.loadSyncData();
              
              if (payload.eventType === 'INSERT') {
                console.log('[CentralizedSubscriptionManager] New queue item, triggering processing');
                setTimeout(() => callback.processQueue(), 1000);
              }
            } catch (error) {
              console.error(`[CentralizedSubscriptionManager] Error calling callback:`, error);
            }
          });
        }
      });

      channel.subscribe((status: string) => {
        console.log(`[CentralizedSubscriptionManager] Channel ${channelKey} status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log(`[CentralizedSubscriptionManager] Successfully subscribed to ${channelKey}`);
          this.activeChannels.set(channelKey, channel);
          resolve();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log(`[CentralizedSubscriptionManager] Channel ${channelKey} closed or error`);
          this.cleanupChannel(channelKey);
          if (status === 'CHANNEL_ERROR') {
            reject(new Error(`Channel subscription failed: ${channelKey}`));
          } else {
            resolve();
          }
        }
      });
    });
  }

  private unsubscribe(channelKey: string, callbacks: SubscriptionCallbacks): void {
    console.log(`[CentralizedSubscriptionManager] Unsubscribe request for ${channelKey}`);
    
    const callbacksSet = this.callbacksMap.get(channelKey);
    if (callbacksSet) {
      callbacksSet.delete(callbacks);
      console.log(`[CentralizedSubscriptionManager] Removed callbacks. Remaining: ${callbacksSet.size}`);

      // If no more callbacks, cleanup the channel
      if (callbacksSet.size === 0) {
        console.log(`[CentralizedSubscriptionManager] No more callbacks, cleaning up channel: ${channelKey}`);
        this.cleanupChannel(channelKey);
      }
    }
  }

  private cleanupChannel(channelKey: string): void {
    const channel = this.activeChannels.get(channelKey);
    if (channel) {
      try {
        channel.unsubscribe();
        console.log(`[CentralizedSubscriptionManager] Unsubscribed channel: ${channelKey}`);
        supabase.removeChannel(channel);
        console.log(`[CentralizedSubscriptionManager] Removed channel: ${channelKey}`);
      } catch (error) {
        console.error(`[CentralizedSubscriptionManager] Error during cleanup:`, error);
      }
    }

    this.activeChannels.delete(channelKey);
    this.callbacksMap.delete(channelKey);
  }

  // Debug method
  getDebugInfo() {
    return {
      activeChannels: Array.from(this.activeChannels.keys()),
      callbackCounts: Array.from(this.callbacksMap.entries()).map(([key, callbacks]) => ({
        channel: key,
        callbackCount: callbacks.size
      })),
      pendingSubscriptions: Array.from(this.subscriptionPromises.keys())
    };
  }
}
