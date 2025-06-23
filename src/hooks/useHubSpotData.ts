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
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = async () => {
    if (!user) return;

    setLoadingPipelines(true);
    setError(null);
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
        const errorMessage = data.error || 'Error fetching pipelines';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching HubSpot pipelines:', error);
      const errorMessage = error.message || 'Error desconocido';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: `No se pudieron cargar los pipelines de HubSpot: ${errorMessage}`,
        variant: "destructive"
      });
      
      // Clear pipelines on error
      setPipelines([]);
    } finally {
      setLoadingPipelines(false);
    }
  };

  const fetchDealStages = async (pipelineId: string) => {
    if (!user || !pipelineId) return;

    setLoadingStages(true);
    setError(null);
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
        const errorMessage = data.error || 'Error fetching deal stages';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching HubSpot deal stages:', error);
      const errorMessage = error.message || 'Error desconocido';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: `No se pudieron cargar las etapas del pipeline: ${errorMessage}`,
        variant: "destructive"
      });
      
      // Clear stages on error
      setDealStages([]);
    } finally {
      setLoadingStages(false);
    }
  };

  const clearStages = () => {
    setDealStages([]);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    pipelines,
    dealStages,
    loadingPipelines,
    loadingStages,
    error,
    fetchPipelines,
    fetchDealStages,
    clearStages,
    clearError
  };
};
