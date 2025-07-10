import { useHubSpotBusinessStateSync } from './useHubSpotBusinessStateSync';
import { useHubSpotAmountSync } from './useHubSpotAmountSync';
import { useHubSpotSyncStats } from './useHubSpotSyncStats';

export const useHubSpotSync = () => {
  // Initialize business state sync (automatic)
  useHubSpotBusinessStateSync();
  
  // Get manual amount sync function
  const { syncAmountToHubSpot } = useHubSpotAmountSync();
  
  // Get sync stats
  const syncStats = useHubSpotSyncStats();

  return { 
    syncAmountToHubSpot,
    syncStats
  };
};

export default useHubSpotSync;