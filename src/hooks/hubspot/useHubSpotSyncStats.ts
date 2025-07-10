import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface HubSpotSyncStats {
  totalPending: number;
  totalSuccessToday: number;
  totalFailedToday: number;
  totalRetrying: number;
  avgExecutionTimeMs: number;
  lastSyncAt: string | null;
  successRatePercentage: number;
}

export const useHubSpotSyncStats = () => {
  const [stats, setStats] = useState<HubSpotSyncStats>({
    totalPending: 0,
    totalSuccessToday: 0,
    totalFailedToday: 0,
    totalRetrying: 0,
    avgExecutionTimeMs: 0,
    lastSyncAt: null,
    successRatePercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: statsError } = await supabase.rpc('get_hubspot_sync_stats');

      if (statsError) {
        throw statsError;
      }

      if (data && data.length > 0) {
        const statsData = data[0];
        setStats({
          totalPending: statsData.total_pending || 0,
          totalSuccessToday: statsData.total_success_today || 0,
          totalFailedToday: statsData.total_failed_today || 0,
          totalRetrying: statsData.total_retrying || 0,
          avgExecutionTimeMs: statsData.avg_execution_time_ms || 0,
          lastSyncAt: statsData.last_sync_at,
          successRatePercentage: statsData.success_rate_percentage || 0
        });
      }
    } catch (err) {
      logger.error('[HubSpot Sync Stats] Error fetching stats', err);
      setError(err instanceof Error ? err.message : 'Error fetching sync stats');
    } finally {
      setLoading(false);
    }
  };

  const retryFailedSyncs = async () => {
    try {
      setError(null);
      
      const { data, error: retryError } = await supabase.rpc('retry_failed_hubspot_syncs');
      
      if (retryError) {
        throw retryError;
      }

      logger.info(`[HubSpot Sync Stats] Retried ${data} failed syncs`);
      
      // Refresh stats after retry
      await fetchStats();
      
      return data;
    } catch (err) {
      logger.error('[HubSpot Sync Stats] Error retrying failed syncs', err);
      setError(err instanceof Error ? err.message : 'Error retrying syncs');
      return 0;
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Set up polling to refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    retryFailedSyncs
  };
};