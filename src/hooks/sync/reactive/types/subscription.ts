
export interface SubscriptionCallbacks {
  loadSyncData: () => Promise<void>;
  processQueue: () => Promise<void>;
}

export interface ActiveSubscription {
  channel: any;
  callbacks: Set<SubscriptionCallbacks>;
  isSubscribed: boolean;
  isSubscribing: boolean;
}
