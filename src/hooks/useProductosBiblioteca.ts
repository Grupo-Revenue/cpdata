
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductoBiblioteca {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  categoria: string;
  activo: boolean;
  linea_producto_id?: string;
  linea_producto?: {
    id: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
  };
}

export const useProductosBiblioteca = () => {
  const [productos, setProductos] = useState<ProductoBiblioteca[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos_biblioteca')
        .select(`
          *,
          linea_producto:lineas_producto (
            id,
            nombre,
            descripcion,
            activo
          )
        `)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos de biblioteca:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos de la biblioteca",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  return {
    productos,
    loading,
    cargarProductos
  };
};
