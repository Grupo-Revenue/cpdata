
import { supabase } from '@/integrations/supabase/client';
import { Presupuesto, EstadoPresupuesto } from '@/types';

export const crearPresupuestoEnSupabase = async (negocioId: string, presupuestoData: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>): Promise<Presupuesto | null> => {
  try {
    console.log('Creating presupuesto with data:', presupuestoData);
    
    // Clean the presupuesto data to only include database columns
    const cleanPresupuestoData = {
      nombre: presupuestoData.nombre,
      estado: presupuestoData.estado,
      total: presupuestoData.total,
      facturado: presupuestoData.facturado || false,
      negocio_id: negocioId,
      fecha_envio: presupuestoData.fecha_envio,
      fecha_aprobacion: presupuestoData.fecha_aprobacion,
      fecha_rechazo: presupuestoData.fecha_rechazo,
      fecha_vencimiento: presupuestoData.fecha_vencimiento
    };

    console.log('Clean presupuesto data for database:', cleanPresupuestoData);
    
    // Start a transaction by creating the main presupuesto first
    const { data: presupuestoCreado, error: presupuestoError } = await supabase
      .from('presupuestos')
      .insert([cleanPresupuestoData])
      .select('*')
      .single();

    if (presupuestoError) {
      console.error("Error creating presupuesto:", presupuestoError);
      throw presupuestoError;
    }

    console.log('Presupuesto created successfully:', presupuestoCreado);

    // Create the complete presupuesto object with the correct type
    let presupuestoCompleto: Presupuesto = {
      ...presupuestoCreado,
      // Add legacy properties for backwards compatibility
      fechaCreacion: presupuestoCreado.created_at,
      fechaEnvio: presupuestoCreado.fecha_envio,
      fechaAprobacion: presupuestoCreado.fecha_aprobacion,
      fechaRechazo: presupuestoCreado.fecha_rechazo,
      fechaVencimiento: presupuestoCreado.fecha_vencimiento,
      productos: []
    };

    // Now insert the products if they exist
    if (presupuestoData.productos && presupuestoData.productos.length > 0) {
      console.log('Inserting products:', presupuestoData.productos);
      
      const productosParaInsertar = presupuestoData.productos.map(producto => ({
        presupuesto_id: presupuestoCreado.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        cantidad: producto.cantidad,
        precio_unitario: producto.precio_unitario,
        total: producto.cantidad * producto.precio_unitario
      }));

      console.log('Products to insert:', productosParaInsertar);

      const { data: productosCreados, error: productosError } = await supabase
        .from('productos_presupuesto')
        .insert(productosParaInsertar)
        .select('*');

      if (productosError) {
        console.error("Error creating productos:", productosError);
        // If products fail to insert, we should clean up the presupuesto
        await supabase.from('presupuestos').delete().eq('id', presupuestoCreado.id);
        throw new Error(`Error al guardar los productos del presupuesto: ${productosError.message}`);
      }

      console.log('Products created successfully:', productosCreados);
      
      // Add the products to the presupuesto object with proper typing
      presupuestoCompleto.productos = productosCreados.map(producto => ({
        ...producto,
        comentarios: '',
        descuentoPorcentaje: 0,
        precioUnitario: producto.precio_unitario
      }));
    }

    console.log('Presupuesto creation completed successfully');
    return presupuestoCompleto;
  } catch (error) {
    console.error("Failed to create presupuesto:", error);
    throw error; // Re-throw to be handled by the calling function
  }
};

export const actualizarPresupuestoEnSupabase = async (presupuestoId: string, updates: Partial<Presupuesto>): Promise<Presupuesto | null> => {
  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .update(updates)
      .eq('id', presupuestoId)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating presupuesto:", error);
      throw error;
    }

    return data as Presupuesto;
  } catch (error) {
    console.error("Failed to update presupuesto:", error);
    return null;
  }
};

export const eliminarPresupuestoEnSupabase = async (presupuestoId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('presupuestos')
      .delete()
      .eq('id', presupuestoId);

    if (error) {
      console.error("Error deleting presupuesto:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete presupuesto:", error);
    return false;
  }
};

export const cambiarEstadoPresupuestoEnSupabase = async (presupuestoId: string, nuevoEstado: EstadoPresupuesto, fechaVencimiento?: string): Promise<Presupuesto | null> => {
  try {
    const updates: { estado: EstadoPresupuesto; fecha_vencimiento?: string } = { estado: nuevoEstado };
    if (fechaVencimiento) {
      updates.fecha_vencimiento = fechaVencimiento;
    }

    const { data, error } = await supabase
      .from('presupuestos')
      .update(updates)
      .eq('id', presupuestoId)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating presupuesto state:", error);
      throw error;
    }

    return data as Presupuesto;
  } catch (error) {
    console.error("Failed to update presupuesto state:", error);
    return null;
  }
};
