
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Producto, LineaProducto, ProductFormData } from '../types/producto.types';

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lineasProducto, setLineasProducto] = useState<LineaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const cargarLineasProducto = async () => {
    try {
      const { data, error } = await supabase
        .from('lineas_producto')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (error) throw error;
      setLineasProducto(data || []);
    } catch (error) {
      console.error('Error cargando líneas de producto:', error);
    }
  };

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarProducto = async (formData: ProductFormData, editingProduct: Producto | null) => {
    if (!formData.nombre || !formData.precio_base) {
      toast({
        title: "Error",
        description: "Nombre y precio son requeridos",
        variant: "destructive"
      });
      return false;
    }

    try {
      const baseProductoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio_base: parseFloat(formData.precio_base),
        linea_producto_id: formData.linea_producto_id === 'none' ? null : formData.linea_producto_id,
      };

      if (editingProduct) {
        // Para edición, no incluir el campo 'activo' para mantener el estado actual
        const { error } = await supabase
          .from('productos_biblioteca')
          .update(baseProductoData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Producto actualizado",
          description: "El producto se actualizó correctamente"
        });
      } else {
        // Para creación, incluir 'activo: true' por defecto
        const productoData = {
          ...baseProductoData,
          activo: true
        };

        const { error } = await supabase
          .from('productos_biblioteca')
          .insert([productoData]);

        if (error) throw error;

        toast({
          title: "Producto creado",
          description: "El producto se creó correctamente"
        });
      }

      cargarProductos();
      return true;
    } catch (error) {
      console.error('Error guardando producto:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive"
      });
      return false;
    }
  };

  const toggleActivoProducto = async (id: string, activo: boolean) => {
    try {
      const { error } = await supabase
        .from('productos_biblioteca')
        .update({ activo: !activo })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Producto ${!activo ? 'activado' : 'desactivado'} correctamente`
      });
      
      cargarProductos();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del producto",
        variant: "destructive"
      });
    }
  };

  const eliminarProducto = useCallback(async (id: string) => {
    try {
      console.log('Eliminando producto con ID:', id);
      const { error } = await supabase
        .from('productos_biblioteca')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó correctamente"
      });
      
      cargarProductos();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive"
      });
    }
  }, [toast, cargarProductos]);

  return {
    productos,
    lineasProducto,
    loading,
    cargarLineasProducto,
    cargarProductos,
    guardarProducto,
    toggleActivoProducto,
    eliminarProducto
  };
};
