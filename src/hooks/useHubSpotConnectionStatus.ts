import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useHubSpotConnectionStatus = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const checkConnection = useCallback(async () => {
    if (!user) {
      console.log('[HubSpot] No user found, setting isConnected to false');
      setIsConnected(false);
      setIsChecking(false);
      setRetryCount(0);
      return;
    }

    try {
      setIsChecking(true);
      console.log(`[HubSpot] Checking connection for user: ${user.id} (attempt ${retryCount + 1})`);
      
      const { data, error } = await supabase
        .from('hubspot_api_keys')
        .select('*')
        .eq('activo', true)
        .maybeSingle();

      if (error) {
        console.error('[HubSpot] Error checking connection:', error);
        
        // Retry logic for transient errors
        if (retryCount < maxRetries && (error.code === 'PGRST116' || error.message?.includes('JWT'))) {
          console.log(`[HubSpot] Retrying connection check in 1 second (attempt ${retryCount + 1}/${maxRetries})`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            checkConnection();
          }, 1000);
          return;
        }
        
        setIsConnected(false);
        setRetryCount(0);
      } else {
        const connectionStatus = !!data;
        console.log(`[HubSpot] Connection check successful: ${connectionStatus}`);
        setIsConnected(connectionStatus);
        setRetryCount(0);
        
        // Log connection details for debugging
        if (data) {
          console.log('[HubSpot] Active API key found:', { id: data.id, user_id: data.user_id });
        } else {
          console.log('[HubSpot] No active API key found for user');
        }
      }
    } catch (error) {
      console.error('[HubSpot] Exception in checkConnection:', error);
      
      // Retry logic for exceptions
      if (retryCount < maxRetries) {
        console.log(`[HubSpot] Retrying connection check due to exception in 1 second (attempt ${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          checkConnection();
        }, 1000);
        return;
      }
      
      setIsConnected(false);
      setRetryCount(0);
    } finally {
      setIsChecking(false);
    }
  }, [user, retryCount]);

  // Check connection when user changes
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isChecking,
    refreshStatus: checkConnection
  };
};