
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SyncConflict } from './types';

export const useSyncConflicts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);

  // Load sync conflicts
  const loadSyncConflicts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hubspot_sync_conflicts')
        .select(`
          *,
          negocios!inner(user_id)
        `)
        .eq('negocios.user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to ensure conflict_type matches our expected union type
      const typedData = (data || []).map(item => ({
        ...item,
        conflict_type: item.conflict_type as 'state' | 'amount' | 'both'
      }));
      
      setSyncConflicts(typedData);
    } catch (error) {
      console.error('[useSyncConflicts] Error loading conflicts:', error);
    }
  }, [user]);

  // Listen to conflict changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sync-conflicts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hubspot_sync_conflicts'
        },
        () => {
          console.log('[useSyncConflicts] Conflict changes detected');
          loadSyncConflicts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadSyncConflicts]);

  return {
    syncConflicts,
    loadSyncConflicts
  };
};
