import { useHubSpotBusinessStateSync } from './useHubSpotBusinessStateSync';
import { useHubSpotAmountSync } from './useHubSpotAmountSync';

export const useHubSpotSync = () => {
  // Initialize business state sync (automatic)
  useHubSpotBusinessStateSync();
  
  // Get manual amount sync function
  const { syncAmountToHubSpot } = useHubSpotAmountSync();

  return { syncAmountToHubSpot };
};

export default useHubSpotSync;