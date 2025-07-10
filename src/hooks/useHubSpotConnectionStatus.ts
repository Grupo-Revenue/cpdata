import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useHubSpotConnectionStatus = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkConnection = useCallback(async () => {
    if (!user) {
      setIsConnected(false);
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      
      const { data, error } = await supabase
        .from('hubspot_api_keys')
        .select('*')
        .eq('activo', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking HubSpot connection:', error);
        setIsConnected(false);
      } else {
        setIsConnected(!!data);
      }
    } catch (error) {
      console.error('Error checking HubSpot connection:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, [user]);

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