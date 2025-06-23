
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HubSpotPipeline {
  id: string;
  label: string;
  displayOrder: number;
  active: boolean;
}

interface HubSpotDealStage {
  id: string;
  label: string;
  displayOrder: number;
  probability: number;
}

export const useHubSpotData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pipelines, setPipelines] = useState<HubSpotPipeline[]>([]);
  const [dealStages, setDealStages] = useState<HubSpotDealStage[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);

  const fetchPipelines = async () => {
    if (!user) return;

    setLoadingPipelines(true);
    try {
      console.log('Fetching HubSpot pipelines...');
      const { data, error } = await supabase.functions.invoke('hubspot-sync', {
        body: { action: 'fetch_pipelines' }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Pipeline fetch response:', data);

      if (data.success) {
        setPipelines(data.data || []);
        console.log('Successfully loaded pipelines:', data.data?.length || 0);
      } else {
        throw new Error(data.error || 'Error fetching pipelines');
      }
    } catch (error) {
      console.error('Error fetching HubSpot pipelines:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pipelines de HubSpot",
        variant: "destructive"
      });
    } finally {
      setLoadingPipelines(false);
    }
  };

  const fetchDealStages = async (pipelineId: string) => {
    if (!user || !pipelineId) return;

    setLoadingStages(true);
    try {
      console.log('Fetching deal stages for pipeline:', pipelineId);
      const { data, error } = await supabase.functions.invoke('hubspot-sync', {
        body: { 
          action: 'fetch_deal_stages',
          pipelineId 
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Deal stages fetch response:', data);

      if (data.success) {
        setDealStages(data.data || []);
        console.log('Successfully loaded deal stages:', data.data?.length || 0);
      } else {
        throw new Error(data.error || 'Error fetching deal stages');
      }
    } catch (error) {
      console.error('Error fetching HubSpot deal stages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las etapas del pipeline",
        variant: "destructive"
      });
    } finally {
      setLoadingStages(false);
    }
  };

  const clearStages = () => {
    setDealStages([]);
  };

  return {
    pipelines,
    dealStages,
    loadingPipelines,
    loadingStages,
    fetchPipelines,
    fetchDealStages,
    clearStages
  };
};
