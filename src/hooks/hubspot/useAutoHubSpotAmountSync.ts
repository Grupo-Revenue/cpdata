import { useEffect } from 'react';
import { useHubSpotAmountSync } from './useHubSpotAmountSync';

export const useAutoHubSpotAmountSync = (negocioId: string) => {
  const { syncAmountToHubSpot } = useHubSpotAmountSync();

  const triggerAmountSync = async () => {
    if (negocioId) {
      console.log('🔄 [Auto Amount Sync] Triggering automatic amount sync for negocio:', negocioId);
      await syncAmountToHubSpot(negocioId);
    }
  };

  return { triggerAmountSync };
};