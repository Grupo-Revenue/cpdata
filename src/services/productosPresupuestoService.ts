import { supabase } from '@/integrations/supabase/client';
import { ProductoPresupuesto } from '@/types';

export const actualizarProductosPresupuesto = async (
  presupuestoId: string, 
  productos: ProductoPresupuesto[]
): Promise<ProductoPresupuesto[]> => {
  try {
    console.log('Updating products for presupuesto:', presupuestoId);
    console.log('Products to update:', productos);

    // First, delete existing products for this presupuesto
    const { error: deleteError } = await supabase
      .from('productos_presupuesto')
      .delete()
      .eq('presupuesto_id', presupuestoId);

    if (deleteError) {
      console.error('Error deleting existing products:', deleteError);
      throw deleteError;
    }

    // Insert new products with sessions
    const productosParaInsertar = productos.map(producto => {
      console.log(`Preparing product ${producto.nombre} for insert:`, {
        sessions: producto.sessions,
        sessionCount: producto.sessions?.length || 0
      });
      
      return {
        presupuesto_id: presupuestoId,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        cantidad: producto.cantidad,
        precio_unitario: producto.precio_unitario,
        total: producto.cantidad * producto.precio_unitario,
        sessions: producto.sessions ? JSON.stringify(producto.sessions) : null
      };
    });

    console.log('Products to insert in database:', productosParaInsertar);

    const { data: productosCreados, error: insertError } = await supabase
      .from('productos_presupuesto')
      .insert(productosParaInsertar)
      .select('*');

    if (insertError) {
      console.error('Error inserting products:', insertError);
      throw insertError;
    }

    console.log('Products inserted successfully:', productosCreados);

    // Return products with proper typing and session parsing
    return productosCreados.map(producto => ({
      ...producto,
      comentarios: '',
      descuentoPorcentaje: 0,
      precioUnitario: producto.precio_unitario,
      sessions: producto.sessions ? 
        (typeof producto.sessions === 'string' ? JSON.parse(producto.sessions) : producto.sessions) : 
        undefined
    }));

  } catch (error) {
    console.error('Failed to update products:', error);
    throw error;
  }
};