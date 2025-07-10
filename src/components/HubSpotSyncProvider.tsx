import React from 'react';
import { useHubSpotSync } from '@/hooks/hubspot/useHubSpotSync';

interface HubSpotSyncProviderProps {
  children: React.ReactNode;
}

export const HubSpotSyncProvider: React.FC<HubSpotSyncProviderProps> = ({ children }) => {
  // Initialize HubSpot sync functionality
  useHubSpotSync();

  return <>{children}</>;
};

export default HubSpotSyncProvider;