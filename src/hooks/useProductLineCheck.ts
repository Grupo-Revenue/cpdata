
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductLine {
  id: string;
  nombre: string;
  activo: boolean;
}

export const useProductLineCheck = () => {
  const [acreditacionLineId, setAcreditacionLineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAcreditacionLine = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('lineas_producto')
          .select('id, nombre, activo')
          .eq('nombre', 'Acreditación')
          .eq('activo', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setAcreditacionLineId(data.id);
        }
      } catch (error) {
        console.error('Error fetching Acreditación product line:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de líneas de producto",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAcreditacionLine();
  }, [toast]);

  const isAcreditacionProduct = (lineaProductoId?: string | null): boolean => {
    if (!acreditacionLineId || !lineaProductoId) return false;
    return lineaProductoId === acreditacionLineId;
  };

  return {
    isAcreditacionProduct,
    acreditacionLineId,
    loading
  };
};
