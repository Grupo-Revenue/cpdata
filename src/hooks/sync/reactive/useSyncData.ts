
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SyncQueueItem, SyncStats } from './types';

export const useSyncData = () => {
  const { user } = useAuth();
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);

  const loadSyncData = useCallback(async () => {
    if (!user) return;

    try {
      // First get the user's negocio IDs
      const { data: negociosData, error: negociosError } = await supabase
        .from('negocios')
        .select('id')
        .eq('user_id', user.id);

      if (negociosError) throw negociosError;

      const negocioIds = negociosData?.map(n => n.id) || [];

      if (negocioIds.length > 0) {
        // Load queue items for user's negocios
        const { data: queueData, error: queueError } = await supabase
          .from('hubspot_sync_queue')
          .select('*')
          .in('negocio_id', negocioIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (queueError) throw queueError;
        setSyncQueue(queueData || []);
      }

      // Load stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_hubspot_sync_stats');

      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setSyncStats(statsData[0]);
      }

    } catch (error) {
      console.error('[useSyncData] Error loading sync data:', error);
    }
  }, [user]);

  return {
    syncQueue,
    syncStats,
    setSyncQueue,
    setSyncStats,
    loadSyncData
  };
};
