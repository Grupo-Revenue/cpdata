import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePresupuestoActions = (negocioId: string, onRefresh: () => void) => {
  const [loading, setLoading] = useState(false);

  const marcarComoFacturado = async (presupuestoId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('marcar_presupuesto_facturado', {
        presupuesto_id_param: presupuestoId
      });

      if (error) throw error;

      toast.success('Presupuesto marcado como facturado');
      onRefresh();
    } catch (error) {
      console.error('Error al marcar presupuesto como facturado:', error);
      toast.error('Error al marcar como facturado');
    } finally {
      setLoading(false);
    }
  };

  return {
    marcarComoFacturado,
    loading
  };
};