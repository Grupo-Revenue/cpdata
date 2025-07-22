import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EstadoPresupuesto } from '@/types';

// Enhanced logging for presupuesto service
const logPresupuestoAction = (action: string, presupuestoId: string, details?: any) => {
  console.log(`📋 [Presupuesto Service] ${action}:`, {
    presupuesto_id: presupuestoId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Function to trigger HubSpot amount sync with enhanced logging
const triggerHubSpotAmountSync = async (negocioId: string, trigger_source: string = 'presupuesto_change') => {
  try {
    console.log('💰 [Presupuesto Service] Triggering HubSpot amount sync:', {
      negocio_id: negocioId,
      trigger_source,
      timestamp: new Date().toISOString()
    });
    
    const { data, error } = await supabase.functions.invoke('hubspot-deal-amount-update', {
      body: { 
        negocio_id: negocioId,
        trigger_source
      }
    });

    if (error) {
      console.error('❌ [Presupuesto Service] Error syncing amount to HubSpot:', error);
      throw error;
    } else {
      console.log('✅ [Presupuesto Service] Amount sync triggered successfully:', data);
    }
  } catch (error) {
    console.error('❌ [Presupuesto Service] Unexpected error during amount sync:', error);
    throw error;
  }
};

export const cambiarEstadoPresupuesto = async (presupuestoId: string, nuevoEstado: EstadoPresupuesto) => {
  try {
    logPresupuestoAction('CHANGING_STATE', presupuestoId, { 
      nuevo_estado: nuevoEstado,
      action: 'cambiarEstadoPresupuesto'
    });

    // Get current state and negocio_id first
    const { data: currentData, error: currentError } = await supabase
      .from('presupuestos')
      .select('estado, negocio_id, nombre, total')
      .eq('id', presupuestoId)
      .single();

    if (currentError || !currentData) {
      console.error('❌ [Presupuesto Service] Error getting current presupuesto:', currentError);
      throw new Error(`Error obteniendo datos del presupuesto: ${currentError?.message || 'Presupuesto no encontrado'}`);
    }

    const estadoAnterior = currentData.estado;
    const negocioId = currentData.negocio_id;
    const presupuestoTotal = currentData.total;

    logPresupuestoAction('STATE_CHANGE_DETAILS', presupuestoId, {
      nombre: currentData.nombre,
      estado_anterior: estadoAnterior,
      estado_nuevo: nuevoEstado,
      negocio_id: negocioId,
      total: presupuestoTotal
    });

    // Update the state
    const { data, error } = await supabase
      .from('presupuestos')
      .update({ estado: nuevoEstado })
      .eq('id', presupuestoId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Presupuesto Service] Error updating state:', error);
      throw new Error(`Error actualizando estado: ${error.message}`);
    }

    if (!data) {
      console.error('❌ [Presupuesto Service] No data returned after update');
      throw new Error('No se recibieron datos después de actualizar el estado');
    }

    logPresupuestoAction('STATE_UPDATED', presupuestoId, {
      update_successful: true,
      new_data: data
    });

    // Check if the state change affects business value calculation
    // IMPORTANT: Now rejections will affect the calculation when approved budgets exist
    const statesAffectingValue = ['aprobado', 'publicado', 'rechazado', 'vencido', 'borrador'];
    const shouldSyncAmount = statesAffectingValue.includes(estadoAnterior) || statesAffectingValue.includes(nuevoEstado);

    if (shouldSyncAmount) {
      console.log('🔄 [Presupuesto Service] State change affects business value, triggering HubSpot sync:', {
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevoEstado,
        trigger_reason: 'state_change_affects_calculation'
      });
      await triggerHubSpotAmountSync(negocioId, 'presupuesto_state_change');
    } else {
      console.log('ℹ️ [Presupuesto Service] State change does not affect business value, skipping sync');
    }

    toast.success(`Presupuesto actualizado a ${nuevoEstado}`);
    return data;

  } catch (error) {
    console.error('❌ [Presupuesto Service] Error in cambiarEstadoPresupuesto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cambiar estado';
    toast.error(`Error: ${errorMessage}`);
    throw error;
  }
};

export const marcarComoFacturado = async (presupuestoId: string) => {
  try {
    logPresupuestoAction('MARKING_INVOICED', presupuestoId);

    // Get negocio_id first
    const { data: presupuestoData, error: presupuestoError } = await supabase
      .from('presupuestos')
      .select('negocio_id, nombre, estado')
      .eq('id', presupuestoId)
      .single();

    if (presupuestoError || !presupuestoData) {
      console.error('❌ [Presupuesto Service] Error getting presupuesto data:', presupuestoError);
      throw new Error(`Error obteniendo datos del presupuesto: ${presupuestoError?.message || 'Presupuesto no encontrado'}`);
    }

    const { error } = await supabase.rpc('marcar_presupuesto_facturado', {
      presupuesto_id_param: presupuestoId
    });

    if (error) {
      console.error('❌ [Presupuesto Service] Error marking as invoiced:', error);
      throw new Error(`Error marcando como facturado: ${error.message}`);
    }

    logPresupuestoAction('MARKED_INVOICED', presupuestoId, {
      nombre: presupuestoData.nombre,
      estado: presupuestoData.estado,
      negocio_id: presupuestoData.negocio_id
    });

    // Trigger HubSpot amount sync after marking as invoiced
    await triggerHubSpotAmountSync(presupuestoData.negocio_id, 'presupuesto_facturado');

    toast.success('Presupuesto marcado como facturado');
    
  } catch (error) {
    console.error('❌ [Presupuesto Service] Error marking as invoiced:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    toast.error(`Error al marcar como facturado: ${errorMessage}`);
    throw error;
  }
};

// Functions for missing exports - maintaining existing signatures
export const crearPresupuestoEnSupabase = async (negocioId: string, presupuestoData: any) => {
  try {
    console.log('🆕 [Presupuesto Service] Creating new presupuesto:', { negocioId, presupuestoData });

    // Validate required fields
    if (!presupuestoData.nombre || !presupuestoData.productos || presupuestoData.productos.length === 0) {
      throw new Error('Datos del presupuesto incompletos: faltan nombre o productos');
    }

    // Create the presupuesto first
    const { data: presupuesto, error: presupuestoError } = await supabase
      .from('presupuestos')
      .insert([{
        negocio_id: negocioId,
        nombre: presupuestoData.nombre,
        estado: presupuestoData.estado || 'borrador',
        total: presupuestoData.total || 0,
        facturado: presupuestoData.facturado || false,
        fecha_vencimiento: presupuestoData.fecha_vencimiento || null
      }])
      .select()
      .single();
    
    if (presupuestoError) {
      console.error('❌ [Presupuesto Service] Error creating presupuesto:', presupuestoError);
      throw new Error(`Error creando presupuesto: ${presupuestoError.message}`);
    }

    if (!presupuesto) {
      throw new Error('No se recibieron datos del presupuesto creado');
    }

    console.log('✅ [Presupuesto Service] Presupuesto created successfully:', presupuesto.id);

    // Insert products
    if (presupuestoData.productos && presupuestoData.productos.length > 0) {
      const productosToInsert = presupuestoData.productos.map((producto: any) => ({
        presupuesto_id: presupuesto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        cantidad: producto.cantidad || 1,
        precio_unitario: producto.precio_unitario || producto.precioUnitario || 0,
        total: (producto.cantidad || 1) * (producto.precio_unitario || producto.precioUnitario || 0),
        sessions: producto.sessions || null
      }));

      console.log('📦 [Presupuesto Service] Inserting products:', productosToInsert.length);

      const { error: productosError } = await supabase
        .from('productos_presupuesto')
        .insert(productosToInsert);
      
      if (productosError) {
        console.error('❌ [Presupuesto Service] Error inserting products:', productosError);
        // Try to clean up the presupuesto if products failed
        await supabase.from('presupuestos').delete().eq('id', presupuesto.id);
        throw new Error(`Error creando productos: ${productosError.message}`);
      }

      console.log('✅ [Presupuesto Service] Products inserted successfully');
    }
    
    // Transform to ExtendedPresupuesto format
    const result = {
      ...presupuesto,
      fechaCreacion: presupuesto.created_at,
      fechaEnvio: presupuesto.fecha_envio,
      fechaAprobacion: presupuesto.fecha_aprobacion,
      fechaRechazo: presupuesto.fecha_rechazo,
      fechaVencimiento: presupuesto.fecha_vencimiento,
      productos: presupuestoData.productos || []
    };

    console.log('🎉 [Presupuesto Service] Presupuesto creation completed successfully');
    await triggerHubSpotAmountSync(negocioId, 'presupuesto_created');
    
    return result;
  } catch (error) {
    console.error('❌ [Presupuesto Service] Error creating presupuesto:', error);
    throw error;
  }
};

export const actualizarPresupuestoEnSupabase = async (presupuestoId: string, updates: any, productos?: any[]) => {
  try {
    console.log('🔄 [Presupuesto Service] Updating presupuesto:', { presupuestoId, updates, productosCount: productos?.length || 0 });

    // Get negocio_id for later HubSpot sync
    const { data: currentPresupuesto, error: currentError } = await supabase
      .from('presupuestos')
      .select('negocio_id, total')
      .eq('id', presupuestoId)
      .single();

    if (currentError || !currentPresupuesto) {
      throw new Error(`Error obteniendo presupuesto actual: ${currentError?.message}`);
    }

    // Update presupuesto
    const { data, error } = await supabase
      .from('presupuestos')
      .update(updates)
      .eq('id', presupuestoId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ [Presupuesto Service] Error updating presupuesto:', error);
      throw new Error(`Error actualizando presupuesto: ${error.message}`);
    }

    if (!data) {
      throw new Error('No se recibieron datos después de actualizar el presupuesto');
    }

    console.log('✅ [Presupuesto Service] Presupuesto updated successfully');
    
    // If productos are provided, update them too
    if (productos && Array.isArray(productos)) {
      console.log('📦 [Presupuesto Service] Updating products...');

      // Delete existing products
      const { error: deleteError } = await supabase
        .from('productos_presupuesto')
        .delete()
        .eq('presupuesto_id', presupuestoId);

      if (deleteError) {
        console.error('❌ [Presupuesto Service] Error deleting existing products:', deleteError);
        throw new Error(`Error eliminando productos existentes: ${deleteError.message}`);
      }
      
      // Insert new products
      if (productos.length > 0) {
        const productosToInsert = productos.map(p => ({
          presupuesto_id: presupuestoId,
          nombre: p.nombre,
          descripcion: p.descripcion || '',
          cantidad: p.cantidad || 1,
          precio_unitario: p.precio_unitario || p.precioUnitario || 0,
          total: (p.cantidad || 1) * (p.precio_unitario || p.precioUnitario || 0),
          sessions: p.sessions || null
        }));

        const { error: insertError } = await supabase
          .from('productos_presupuesto')
          .insert(productosToInsert);

        if (insertError) {
          console.error('❌ [Presupuesto Service] Error inserting updated products:', insertError);
          throw new Error(`Error insertando productos actualizados: ${insertError.message}`);
        }

        console.log('✅ [Presupuesto Service] Products updated successfully');
      }
    }
    
    // Transform to ExtendedPresupuesto format
    const result = {
      ...data,
      fechaCreacion: data.created_at,
      fechaEnvio: data.fecha_envio,
      fechaAprobacion: data.fecha_aprobacion,
      fechaRechazo: data.fecha_rechazo,
      fechaVencimiento: data.fecha_vencimiento
    };

    console.log('🎉 [Presupuesto Service] Presupuesto update completed successfully');
    
    // Trigger HubSpot amount sync if total changed
    if (updates.total !== undefined) {
      await triggerHubSpotAmountSync(currentPresupuesto.negocio_id, 'presupuesto_total_updated');
    }
    
    return result;
  } catch (error) {
    console.error('❌ [Presupuesto Service] Error updating presupuesto:', error);
    throw error;
  }
};

export const eliminarPresupuestoEnSupabase = async (presupuestoId: string) => {
  try {
    console.log('🗑️ [Presupuesto Service] Deleting presupuesto:', presupuestoId);

    // Get presupuesto details before deletion for HubSpot sync
    const { data: presupuestoData, error: presupuestoError } = await supabase
      .from('presupuestos')
      .select('negocio_id, total, estado, nombre')
      .eq('id', presupuestoId)
      .single();

    if (presupuestoError || !presupuestoData) {
      console.error('❌ [Presupuesto Service] Error getting presupuesto before deletion:', presupuestoError);
      throw new Error(`Error obteniendo presupuesto: ${presupuestoError?.message}`);
    }

    const { error } = await supabase
      .from('presupuestos')
      .delete()
      .eq('id', presupuestoId);
    
    if (error) {
      console.error('❌ [Presupuesto Service] Error deleting presupuesto:', error);
      throw new Error(`Error eliminando presupuesto: ${error.message}`);
    }

    console.log('✅ [Presupuesto Service] Presupuesto deleted successfully:', {
      id: presupuestoId,
      negocio_id: presupuestoData.negocio_id,
      deleted_total: presupuestoData.total,
      deleted_estado: presupuestoData.estado
    });

    // Trigger HubSpot amount sync after deletion
    await triggerHubSpotAmountSync(presupuestoData.negocio_id, 'presupuesto_deleted');
    
    return true;
  } catch (error) {
    console.error('❌ [Presupuesto Service] Error deleting presupuesto:', error);
    throw error;
  }
};

export const cambiarEstadoPresupuestoEnSupabase = async (presupuestoId: string, nuevoEstado: EstadoPresupuesto, fechaVencimiento?: string) => {
  return await cambiarEstadoPresupuesto(presupuestoId, nuevoEstado);
};
