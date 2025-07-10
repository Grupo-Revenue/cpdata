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
        .eq('user_id', user.id)
        .eq('activo', true)
        .single();

      if (error && error.code !== 'PGRST116') {
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

  // Set up real-time subscription to detect changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('hubspot_api_keys_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hubspot_api_keys',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          checkConnection();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, checkConnection]);

  return {
    isConnected,
    isChecking,
    refreshStatus: checkConnection
  };
};