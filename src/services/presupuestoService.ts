
import { supabase } from '@/integrations/supabase/client';
import { Presupuesto, EstadoPresupuesto, ProductoPresupuesto } from '@/types';

// Function to trigger HubSpot amount sync
const triggerHubSpotAmountSync = async (negocioId: string) => {
  try {
    console.log('💰 [Presupuesto Service] Triggering HubSpot amount sync for negocio:', negocioId);
    
    // Call the HubSpot amount sync edge function
    const { error } = await supabase.functions.invoke('hubspot-deal-amount-update', {
      body: { 
        negocio_id: negocioId,
        trigger_source: 'presupuesto_change'
      }
    });

    if (error) {
      console.error('❌ [Presupuesto Service] Error syncing amount to HubSpot:', error);
    } else {
      console.log('✅ [Presupuesto Service] Amount sync triggered successfully');
    }
  } catch (error) {
    console.error('❌ [Presupuesto Service] Unexpected error during amount sync:', error);
  }
};

export const crearPresupuestoEnSupabase = async (negocioId: string, presupuestoData: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>): Promise<Presupuesto | null> => {
  try {
    console.log('🔥 [crearPresupuestoEnSupabase] Starting presupuesto creation');
    console.log('🔥 [crearPresupuestoEnSupabase] negocioId:', negocioId);
    console.log('🔥 [crearPresupuestoEnSupabase] presupuestoData:', presupuestoData);
    
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

    console.log('🔥 [crearPresupuestoEnSupabase] cleanPresupuestoData:', cleanPresupuestoData);
    
    // Start a transaction by creating the main presupuesto first
    console.log('🔥 [crearPresupuestoEnSupabase] About to insert into presupuestos table');
    const { data: presupuestoCreado, error: presupuestoError } = await supabase
      .from('presupuestos')
      .insert([cleanPresupuestoData])
      .select('*')
      .single();

    if (presupuestoError) {
      console.error("🔥 [crearPresupuestoEnSupabase] Error creating presupuesto:", presupuestoError);
      console.error("🔥 [crearPresupuestoEnSupabase] Error details:", {
        message: presupuestoError.message,
        details: presupuestoError.details,
        hint: presupuestoError.hint,
        code: presupuestoError.code
      });
      throw presupuestoError;
    }

    console.log('🔥 [crearPresupuestoEnSupabase] Presupuesto created successfully:', presupuestoCreado);

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
        total: producto.cantidad * producto.precio_unitario,
        sessions: producto.sessions && producto.sessions.length > 0 ? JSON.stringify(producto.sessions) : null
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
        precioUnitario: producto.precio_unitario,
        sessions: producto.sessions ? (typeof producto.sessions === 'string' ? JSON.parse(producto.sessions) : producto.sessions) : undefined
      }));
    }

    console.log('Presupuesto creation completed successfully');
    
    // Trigger HubSpot amount sync after successful presupuesto creation
    await triggerHubSpotAmountSync(negocioId);
    
    return presupuestoCompleto;
  } catch (error) {
    console.error("Failed to create presupuesto:", error);
    throw error; // Re-throw to be handled by the calling function
  }
};

export const actualizarPresupuestoEnSupabase = async (
  presupuestoId: string, 
  updates: Partial<Presupuesto>,
  productos?: ProductoPresupuesto[]
): Promise<Presupuesto | null> => {
  try {
    console.log('Updating presupuesto:', presupuestoId, 'with data:', updates);
    console.log('Products to update:', productos);

    // Update the presupuesto basic data
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

    console.log('Presupuesto updated successfully:', data);

    // Get negocio_id for HubSpot sync
    const negocioId = data.negocio_id;

    // If products are provided, update them as well
    if (productos && productos.length > 0) {
      console.log('Updating products for presupuesto:', presupuestoId);
      
      // Delete existing products
      const { error: deleteError } = await supabase
        .from('productos_presupuesto')
        .delete()
        .eq('presupuesto_id', presupuestoId);

      if (deleteError) {
        console.error('Error deleting existing products:', deleteError);
        throw deleteError;
      }

      // Insert updated products
      const productosParaInsertar = productos.map(producto => ({
        presupuesto_id: presupuestoId,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        cantidad: producto.cantidad,
        precio_unitario: producto.precio_unitario,
        total: producto.cantidad * producto.precio_unitario,
        sessions: producto.sessions && producto.sessions.length > 0 ? JSON.stringify(producto.sessions) : null
      }));

      const { data: productosCreados, error: productosError } = await supabase
        .from('productos_presupuesto')
        .insert(productosParaInsertar)
        .select('*');

      if (productosError) {
        console.error('Error inserting updated products:', productosError);
        throw productosError;
      }

      console.log('Products updated successfully:', productosCreados);
    }

    // Trigger HubSpot amount sync after successful presupuesto update
    await triggerHubSpotAmountSync(negocioId);

    return data as Presupuesto;
  } catch (error) {
    console.error("Failed to update presupuesto:", error);
    return null;
  }
};

export const eliminarPresupuestoEnSupabase = async (presupuestoId: string): Promise<boolean> => {
  try {
    // Get negocio_id before deleting for HubSpot sync
    const { data: presupuesto } = await supabase
      .from('presupuestos')
      .select('negocio_id')
      .eq('id', presupuestoId)
      .single();

    const { error } = await supabase
      .from('presupuestos')
      .delete()
      .eq('id', presupuestoId);

    if (error) {
      console.error("Error deleting presupuesto:", error);
      throw error;
    }

    // Trigger HubSpot amount sync after successful presupuesto deletion
    if (presupuesto?.negocio_id) {
      await triggerHubSpotAmountSync(presupuesto.negocio_id);
    }

    return true;
  } catch (error) {
    console.error("Failed to delete presupuesto:", error);
    return false;
  }
};

export const cambiarEstadoPresupuestoEnSupabase = async (presupuestoId: string, nuevoEstado: EstadoPresupuesto, fechaVencimiento?: string): Promise<Presupuesto | null> => {
  try {
    console.log('📝 [Presupuesto Service] === INICIO CAMBIO ESTADO DB ===');
    console.log('📝 [Presupuesto Service] Parámetros:', { presupuestoId, nuevoEstado, fechaVencimiento });

    // Validar parámetros
    if (!presupuestoId || !nuevoEstado) {
      throw new Error('Parámetros inválidos: presupuestoId y nuevoEstado son requeridos');
    }

    const updates: { estado: EstadoPresupuesto; fecha_vencimiento?: string } = { estado: nuevoEstado };
    if (fechaVencimiento) {
      updates.fecha_vencimiento = fechaVencimiento;
    }

    console.log('📝 [Presupuesto Service] Updates a enviar:', updates);

    const { data, error } = await supabase
      .from('presupuestos')
      .update(updates)
      .eq('id', presupuestoId)
      .select('*')
      .single();

    if (error) {
      console.error("❌ [Presupuesto Service] Error updating presupuesto state:", error);
      console.error("❌ [Presupuesto Service] Error details:", error.details);
      console.error("❌ [Presupuesto Service] Error hint:", error.hint);
      console.error("❌ [Presupuesto Service] Error code:", error.code);
      console.error("❌ [Presupuesto Service] Error message:", error.message);
      
      // Proporcionar error más específico para el usuario
      let userMessage = 'Error al actualizar el estado del presupuesto';
      
      if (error.message) {
        if (error.message.includes('violates check constraint') || error.message.includes('violates row-level security')) {
          userMessage = 'No tienes permisos para realizar esta acción o el presupuesto no se puede cambiar a este estado';
        } else if (error.message.includes('not found')) {
          userMessage = 'El presupuesto no fue encontrado';
        } else if (error.code === 'PGRST116') {
          userMessage = 'No se encontró el presupuesto o no tienes permisos para modificarlo';
        }
      }
      
      throw new Error(userMessage);
    }

    if (!data) {
      console.error("❌ [Presupuesto Service] No data returned from update");
      throw new Error('No se recibieron datos del servidor después de la actualización');
    }

    console.log('✅ [Presupuesto Service] Presupuesto actualizado exitosamente:', {
      id: data.id,
      estado: data.estado,
      nombre: data.nombre
    });

    // Si el estado cambia a 'publicado', crear automáticamente el link público
    if (nuevoEstado === 'publicado' && data?.negocio_id) {
      try {
        console.log('🔗 [Presupuesto Service] Creando link público automáticamente');
        
        const { error: linkError } = await supabase.functions.invoke('hubspot-link-manager', {
          body: {
            presupuesto_id: presupuestoId,
            negocio_id: data.negocio_id,
            regenerate: false
          }
        });

        if (linkError) {
          console.error('⚠️ [Presupuesto Service] Error creando link público:', linkError);
          // No fallar el cambio de estado si falla la creación del link
        } else {
          console.log('✅ [Presupuesto Service] Link público creado exitosamente');
        }
      } catch (linkError) {
        console.error('⚠️ [Presupuesto Service] Error inesperado creando link público:', linkError);
        // No fallar el cambio de estado si falla la creación del link
      }
    }

    // Trigger HubSpot amount sync after successful state change
    if (data?.negocio_id) {
      try {
        console.log('💰 [Presupuesto Service] Triggering HubSpot amount sync...');
        await triggerHubSpotAmountSync(data.negocio_id);
        console.log('✅ [Presupuesto Service] HubSpot amount sync triggered successfully');
      } catch (syncError) {
        console.error('⚠️ [Presupuesto Service] Error triggering HubSpot amount sync:', syncError);
        // No fallar el cambio de estado si falla la sincronización
      }
    }

    console.log('✅ [Presupuesto Service] === FIN CAMBIO ESTADO DB ===');
    return data as Presupuesto;
  } catch (error) {
    console.error("❌ [Presupuesto Service] === ERROR CAMBIO ESTADO DB ===");
    console.error("❌ [Presupuesto Service] Error details:", error);
    console.error("❌ [Presupuesto Service] Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
};
