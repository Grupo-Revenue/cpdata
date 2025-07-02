
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SyncConflict } from './types';

export const useSyncConflicts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  // Load sync conflicts
  const loadSyncConflicts = useCallback(async () => {
    if (!user) return;

    try {
      console.log('[useSyncConflicts] Loading sync conflicts for user:', user.id);
      
      const { data, error } = await supabase
        .from('hubspot_sync_conflicts')
        .select(`
          *,
          negocios!inner(user_id)
        `)
        .eq('negocios.user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useSyncConflicts] Error loading conflicts:', error);
        throw error;
      }
      
      // Type cast the data to ensure conflict_type matches our expected union type
      const typedData = (data || []).map(item => ({
        ...item,
        conflict_type: item.conflict_type as 'state' | 'amount' | 'both'
      }));
      
      console.log('[useSyncConflicts] Loaded conflicts:', typedData.length);
      setSyncConflicts(typedData);
    } catch (error) {
      console.error('[useSyncConflicts] Error loading conflicts:', error);
      // Don't throw error to prevent breaking the app
      setSyncConflicts([]);
    }
  }, [user]);

  // Enhanced subscription management with error boundaries
  useEffect(() => {
    if (!user || isSubscribedRef.current) {
      console.log('[useSyncConflicts] Skipping subscription setup:', { user: !!user, isSubscribed: isSubscribedRef.current });
      return;
    }

    console.log('[useSyncConflicts] Setting up conflict subscription...');

    try {
      // Clean up any existing channel first
      if (channelRef.current) {
        console.log('[useSyncConflicts] Cleaning up existing channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create new channel with unique name
      const channelName = `sync-conflicts-${user.id}-${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hubspot_sync_conflicts'
          },
          (payload) => {
            console.log('[useSyncConflicts] Conflict changes detected:', payload);
            // Reload conflicts with debounce
            setTimeout(() => {
              loadSyncConflicts().catch(error => {
                console.error('[useSyncConflicts] Error reloading conflicts:', error);
              });
            }, 500);
          }
        )
        .subscribe((status) => {
          console.log('[useSyncConflicts] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
            console.log('[useSyncConflicts] Successfully subscribed to conflict changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[useSyncConflicts] Channel subscription error');
            isSubscribedRef.current = false;
          } else if (status === 'TIMED_OUT') {
            console.warn('[useSyncConflicts] Subscription timed out, will retry');
            isSubscribedRef.current = false;
          }
        });

      channelRef.current = channel;

    } catch (error) {
      console.error('[useSyncConflicts] Error setting up subscription:', error);
      isSubscribedRef.current = false;
      // Don't throw error to prevent breaking the app
    }

    // Cleanup function
    return () => {
      console.log('[useSyncConflicts] Cleaning up subscription');
      isSubscribedRef.current = false;
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.error('[useSyncConflicts] Error removing channel:', error);
        }
        channelRef.current = null;
      }
    };
  }, [user, loadSyncConflicts]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadSyncConflicts().catch(error => {
        console.error('[useSyncConflicts] Error loading initial conflicts:', error);
      });
    }
  }, [user, loadSyncConflicts]);

  return {
    syncConflicts,
    loadSyncConflicts
  };
};
