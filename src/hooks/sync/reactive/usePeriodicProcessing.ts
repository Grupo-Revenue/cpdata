
import { useEffect } from 'react';

export const usePeriodicProcessing = (
  config: any,
  processQueue: () => Promise<void>
) => {
  // Periodic queue processing
  useEffect(() => {
    if (!config?.auto_sync || !config?.api_key_set) return;

    console.log('[usePeriodicProcessing] Setting up periodic processing every 30 seconds');
    
    const interval = setInterval(() => {
      console.log('[usePeriodicProcessing] Triggering periodic queue processing');
      processQueue();
    }, 30000); // Process every 30 seconds

    return () => {
      console.log('[usePeriodicProcessing] Cleaning up periodic processing interval');
      clearInterval(interval);
    };
  }, [config?.auto_sync, config?.api_key_set, processQueue]);
};
