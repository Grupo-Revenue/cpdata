import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BudgetTermsConfig {
  id: string;
  validez_oferta: string;
  forma_pago: string;
  tiempo_entrega: string;
  moneda: string;
  precios_incluyen: string;
  condicion_comercial_1?: string;
  condicion_comercial_2?: string;
  condicion_comercial_3?: string;
  condicion_comercial_4?: string;
  condicion_comercial_5?: string;
  condicion_comercial_6?: string;
  observacion_1: string;
  observacion_2: string;
  observacion_3: string;
  observacion_4: string;
  observacion_5: string;
  observacion_6: string;
  certificacion_texto: string;
  documento_texto: string;
  created_at: string;
  updated_at: string;
}

export const useBudgetTermsConfig = () => {
  const [config, setConfig] = useState<BudgetTermsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('budget_terms_config')
        .select('*')
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Error loading budget terms config:', fetchError);
        setError('Error al cargar la configuración de términos');
        return;
      }

      setConfig(data);
    } catch (err) {
      console.error('Unexpected error loading budget terms config:', err);
      setError('Error inesperado al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<BudgetTermsConfig>) => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('budget_terms_config')
        .update(updates)
        .eq('id', config?.id || '00000000-0000-0000-0000-000000000001');

      if (updateError) {
        console.error('Error updating budget terms config:', updateError);
        setError('Error al actualizar la configuración');
        return false;
      }

      await loadConfig(); // Reload to get updated data
      return true;
    } catch (err) {
      console.error('Unexpected error updating budget terms config:', err);
      setError('Error inesperado al actualizar la configuración');
      return false;
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    loading,
    error,
    updateConfig,
    refetch: loadConfig,
  };
};