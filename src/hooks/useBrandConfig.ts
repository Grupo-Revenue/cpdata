
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
  // Initialize with default config without logo to prevent conflicts
  const [config, setConfig] = useState<BrandConfig | null>({
    nombre_empresa: 'CP Data',
    telefono: '+56 9 1234 5678',
    email: 'contacto@cpdata.cl',
    sitio_web: 'www.cpdata.cl',
    direccion: 'Santiago, Chile',
    color_primario: '#3B82F6',
    color_secundario: '#1E40AF'
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
        
        // Check if logo_url is already a complete URL, if not construct it
        const configWithFullUrl = {
          ...data,
          logo_url: data.logo_url ? (
            data.logo_url.startsWith('https://') 
              ? `${data.logo_url}?v=${Date.now()}` 
              : `https://ejvtuuvigcqpibpfcxch.supabase.co/storage/v1/object/public/brand-assets/${data.logo_url}?v=${Date.now()}`
          ) : undefined
        };
        
        setConfig(configWithFullUrl);
        setLastFetch(Date.now());
      } else {
        logger.info('No brand config found in database, using default without logo');
        // Configuración por defecto sin logo para forzar el uso de la base de datos
        const defaultConfig = {
          nombre_empresa: 'CP Data',
          telefono: '+56 9 1234 5678',
          email: 'contacto@cpdata.cl',
          sitio_web: 'www.cpdata.cl',
          direccion: 'Santiago, Chile',
          color_primario: '#3B82F6',
          color_secundario: '#1E40AF'
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
