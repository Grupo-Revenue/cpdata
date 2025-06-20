
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [config, setConfig] = useState<BrandConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('configuracion_marca')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      } else {
        // Configuración por defecto si no existe
        setConfig({
          nombre_empresa: 'CP Data',
          color_primario: '#3B82F6',
          color_secundario: '#1E40AF'
        });
      }
    } catch (err) {
      console.error('Error loading brand config:', err);
      setError('Error cargando configuración de marca');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    loading,
    error,
    refetch: loadConfig
  };
};
