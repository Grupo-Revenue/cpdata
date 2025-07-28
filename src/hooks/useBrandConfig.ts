
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface BrandConfig {
  id?: string;
  nombre_empresa: string;
  telefono?: string;
  email?: string;
  sitio_web?: string;
  direccion?: string;
  color_primario: string;
  color_secundario: string;
  logo_url?: string;
}

export const useBrandConfig = () => {
  // Initialize with default config to prevent logo flashing
  const [config, setConfig] = useState<BrandConfig | null>({
    nombre_empresa: 'CP Data',
    telefono: '+56 9 1234 5678',
    email: 'contacto@cpdata.cl',
    sitio_web: 'www.cpdata.cl',
    direccion: 'Santiago, Chile',
    color_primario: '#3B82F6',
    color_secundario: '#1E40AF',
    logo_url: '/lovable-uploads/9117dc90-5700-487a-8e16-024d18b1047b.webp'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const loadConfig = async (forceFetch = false) => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Loading brand config...', { forceFetch, lastFetch });
      
      const { data, error } = await supabase
        .from('configuracion_marca')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching brand config from database', error);
        throw error;
      }

      if (data) {
        logger.info('Brand config loaded from database', { 
          logo_url: data.logo_url,
          nombre_empresa: data.nombre_empresa 
        });
        
        // Simple cache-busting only on force refresh
        const configWithCacheBuster = {
          ...data,
          logo_url: data.logo_url && forceFetch ? `${data.logo_url}?v=${Date.now()}` : data.logo_url
        };
        
        setConfig(configWithCacheBuster);
        setLastFetch(Date.now());
      } else {
        logger.info('No brand config found in database, using default');
        // Configuración por defecto si no existe
        const defaultConfig = {
          nombre_empresa: 'CP Data',
          telefono: '+56 9 1234 5678',
          email: 'contacto@cpdata.cl',
          sitio_web: 'www.cpdata.cl',
          direccion: 'Santiago, Chile',
          color_primario: '#3B82F6',
          color_secundario: '#1E40AF',
          logo_url: '/lovable-uploads/9117dc90-5700-487a-8e16-024d18b1047b.webp'
        };
        setConfig(defaultConfig);
        setLastFetch(Date.now());
      }
    } catch (err) {
      logger.error('Error loading brand config', err);
      setError('Error cargando configuración de marca');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const forceRefresh = () => {
    logger.info('Force refreshing brand config');
    loadConfig(true);
  };

  return {
    config,
    loading,
    error,
    refetch: loadConfig,
    forceRefresh,
    lastFetch
  };
};
