
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HubSpotConfig {
  id?: string;
  user_id: string;
  api_key_set: boolean;
  auto_sync: boolean;
  default_pipeline_id?: string;
  default_deal_stage?: string;
  bidirectional_sync: boolean;
  webhook_enabled: boolean;
  conflict_resolution_strategy: string;
  polling_interval_minutes: number;
}

export const useHubSpotConfig = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<HubSpotConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConfig = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hubspot_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      } else {
        // Create default config
        const defaultConfig = {
          user_id: user.id,
          api_key_set: false,
          auto_sync: true,
          bidirectional_sync: false,
          webhook_enabled: false,
          conflict_resolution_strategy: 'manual',
          polling_interval_minutes: 30,
        };

        const { data: newConfig, error: createError } = await supabase
          .from('hubspot_config')
          .insert(defaultConfig)
          .select()
          .single();

        if (createError) throw createError;
        setConfig(newConfig);
      }
    } catch (error) {
      console.error('Error loading HubSpot config:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración de HubSpot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<HubSpotConfig>) => {
    if (!user || !config) return;

    try {
      const { data, error } = await supabase
        .from('hubspot_config')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setConfig(data);
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente"
      });
    } catch (error) {
      console.error('Error updating HubSpot config:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive"
      });
    }
  };

  const syncNegocio = async (negocioData: any, action: 'create' | 'update') => {
    if (!config?.auto_sync || !config?.api_key_set) {
      console.log('HubSpot sync disabled or not configured');
      return { success: true, skipped: true };
    }

    try {
      const { data, error } = await supabase.functions.invoke('hubspot-sync', {
        body: {
          action,
          negocioData
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error syncing with HubSpot:', error);
      toast({
        title: "Error de sincronización",
        description: "No se pudo sincronizar con HubSpot",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  return {
    config,
    loading,
    updateConfig,
    syncNegocio,
    reloadConfig: loadConfig
  };
};
