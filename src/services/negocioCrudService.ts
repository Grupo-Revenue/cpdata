import { supabase } from '@/integrations/supabase/client';
import { Negocio, EstadoNegocio } from '@/types';

export const crearNegocioEnSupabase = async (negocioData: any): Promise<Negocio | null> => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    // Handle contact ID - use processed contact ID if provided
    let contactoId = negocioData.contactoId;
    
    // Legacy support: if contacto object is provided instead of contactoId
    if (!contactoId && negocioData.contacto) {
      const { data: existingContact, error: findError } = await supabase
        .from('contactos')
        .select('id')
        .eq('user_id', userId)
        .eq('email', negocioData.contacto.email.toLowerCase())
        .maybeSingle();

      if (findError) throw findError;
      
      if (existingContact) {
        contactoId = existingContact.id;
      } else {
        const { data: newContact, error: createError } = await supabase
          .from('contactos')
          .insert([{
            ...negocioData.contacto,
            email: negocioData.contacto.email.toLowerCase(),
            user_id: userId
          }])
          .select('id')
          .single();

        if (createError) throw createError;
        contactoId = newContact.id;
      }
    }

    // Handle productora
    let productoraId = null;
    if (negocioData.productora) {
      if (negocioData.productora.id) {
        // Use existing productora ID
        productoraId = negocioData.productora.id;
      } else {
        const { data: existingCompany, error: findError } = await supabase
          .from('empresas')
          .select('id')
          .eq('user_id', userId)
          .eq('nombre', negocioData.productora.nombre)
          .eq('tipo', 'productora')
          .maybeSingle();

        if (findError) throw findError;
        
        if (existingCompany) {
          productoraId = existingCompany.id;
        } else {
          const { data: newCompany, error: createError } = await supabase
            .from('empresas')
            .insert([{
              ...negocioData.productora,
              user_id: userId
            }])
            .select('id')
            .single();

          if (createError) throw createError;
          productoraId = newCompany.id;
        }
      }
    }

    // Handle cliente final
    let clienteFinalId = null;
    if (negocioData.clienteFinal) {
      if (negocioData.clienteFinal.id) {
        // Use existing cliente final ID
        clienteFinalId = negocioData.clienteFinal.id;
      } else {
        const { data: existingCompany, error: findError } = await supabase
          .from('empresas')
          .select('id')
          .eq('user_id', userId)
          .eq('nombre', negocioData.clienteFinal.nombre)
          .eq('tipo', 'cliente_final')
          .maybeSingle();

        if (findError) throw findError;
        
        if (existingCompany) {
          clienteFinalId = existingCompany.id;
        } else {
          const { data: newCompany, error: createError } = await supabase
            .from('empresas')
            .insert([{
              ...negocioData.clienteFinal,
              user_id: userId
            }])
            .select('id')
            .single();

          if (createError) throw createError;
          clienteFinalId = newCompany.id;
        }
      }
    }

    // Get next business number atomically using the global function
    const { data: nextNumberData, error: numberError } = await supabase
      .rpc('get_next_business_number');

    if (numberError) throw numberError;
    
    const nextNumber = nextNumberData;
    
    // Log the number assignment for auditing
    await supabase
      .rpc('log_business_number_assignment', {
        p_user_id: userId,
        p_business_number: nextNumber,
        p_status: 'assigned',
        p_notes: 'Number assigned for new business creation'
      });

    // Create the negocio with the atomically assigned number
    const { data, error } = await supabase
      .from('negocios')
      .insert([{
        user_id: userId,
        numero: negocioData.numero || nextNumber, // Use provided number or generated one
        contacto_id: contactoId,
        productora_id: productoraId,
        cliente_final_id: clienteFinalId,
        tipo_evento: negocioData.tipo_evento,
        nombre_evento: negocioData.nombre_evento,
        fecha_evento: negocioData.fecha_evento,
        horas_acreditacion: negocioData.horas_acreditacion,
        cantidad_asistentes: negocioData.cantidad_asistentes || 0,
        cantidad_invitados: negocioData.cantidad_invitados || 0,
        locacion: negocioData.locacion,
        fecha_cierre: negocioData.fecha_cierre,
        estado: 'oportunidad_creada'
      }])
      .select(`
        *,
        contacto: contactos (id, nombre, apellido, email, telefono, cargo, created_at, updated_at, user_id),
        productora: empresas!productora_id (id, nombre, tipo, rut, sitio_web, direccion, created_at, updated_at, user_id),
        clienteFinal: empresas!cliente_final_id (id, nombre, tipo, rut, sitio_web, direccion, created_at, updated_at, user_id),
        presupuestos (
          id,
          estado,
          facturado,
          total,
          created_at,
          fecha_envio,
          fecha_aprobacion,
          fecha_rechazo,
          fecha_vencimiento,
          nombre,
          negocio_id,
          updated_at
        )
      `)
      .single();

    if (error) {
      console.error("Error creating negocio:", error);
      
      // Log the failed creation for auditing
      await supabase
        .rpc('log_business_number_assignment', {
          p_user_id: userId,
          p_business_number: negocioData.numero || nextNumber,
          p_status: 'failed',
          p_notes: `Business creation failed: ${error.message}`
        });
      
      throw error;
    }

    // Log successful business creation
    await supabase
      .rpc('log_business_number_assignment', {
        p_user_id: userId,
        p_business_number: data.numero,
        p_negocio_id: data.id,
        p_status: 'used',
        p_notes: 'Business created successfully'
      });

    const transformedNegocio = {
      ...data,
      evento: {
        tipoEvento: data.tipo_evento,
        nombreEvento: data.nombre_evento,
        fechaEvento: data.fecha_evento,
        horasAcreditacion: data.horas_acreditacion,
        cantidadAsistentes: data.cantidad_asistentes,
        cantidadInvitados: data.cantidad_invitados,
        locacion: data.locacion
      },
      fechaCreacion: data.created_at,
      fechaCierre: data.fecha_cierre,
      presupuestos: data.presupuestos?.map(p => ({
        ...p,
        fechaCreacion: p.created_at,
        fechaEnvio: p.fecha_envio,
        fechaAprobacion: p.fecha_aprobacion,
        fechaRechazo: p.fecha_rechazo,
        fechaVencimiento: p.fecha_vencimiento
      })) || []
    };

    return transformedNegocio as Negocio;
  } catch (error) {
    console.error("Failed to create negocio:", error);
    return null;
  }
};

export const actualizarNegocioEnSupabase = async (id: string, updates: Partial<Negocio>): Promise<Negocio | null> => {
  try {
    const { data, error } = await supabase
      .from('negocios')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        contacto: contactos (id, nombre, apellido, email, telefono, cargo, created_at, updated_at, user_id),
        productora: empresas!productora_id (id, nombre, tipo, rut, sitio_web, direccion, created_at, updated_at, user_id),
        clienteFinal: empresas!cliente_final_id (id, nombre, tipo, rut, sitio_web, direccion, created_at, updated_at, user_id),
        presupuestos (
          id,
          estado,
          facturado,
          total,
          created_at,
          fecha_envio,
          fecha_aprobacion,
          fecha_rechazo,
          fecha_vencimiento,
          nombre,
          negocio_id,
          updated_at
        )
      `)
      .single();

    if (error) {
      console.error("Error updating negocio:", error);
      throw error;
    }

    // Transform the data
    const transformedNegocio = {
      ...data,
      evento: {
        tipoEvento: data.tipo_evento,
        nombreEvento: data.nombre_evento,
        fechaEvento: data.fecha_evento,
        horasAcreditacion: data.horas_acreditacion,
        cantidadAsistentes: data.cantidad_asistentes || 0,
        cantidadInvitados: data.cantidad_invitados || 0,
        locacion: data.locacion
      },
      fechaCreacion: data.created_at,
      fechaCierre: data.fecha_cierre,
      presupuestos: data.presupuestos?.map(p => ({
        ...p,
        fechaCreacion: p.created_at,
        fechaEnvio: p.fecha_envio,
        fechaAprobacion: p.fecha_aprobacion,
        fechaRechazo: p.fecha_rechazo,
        fechaVencimiento: p.fecha_vencimiento
      })) || []
    };

    return transformedNegocio as Negocio;
  } catch (error) {
    console.error("Failed to update negocio:", error);
    return null;
  }
};

export const eliminarNegocioEnSupabase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('negocios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting negocio:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete negocio:", error);
    return false;
  }
};

export const cambiarEstadoNegocioEnSupabase = async (negocioId: string, nuevoEstado: EstadoNegocio): Promise<Negocio | null> => {
  try {
    const { data, error } = await supabase
      .from('negocios')
      .update({ estado: nuevoEstado })
      .eq('id', negocioId)
      .select(`
        *,
        contacto: contactos (id, nombre, apellido, email, telefono, cargo, created_at, updated_at, user_id),
        productora: empresas!productora_id (id, nombre, tipo, rut, sitio_web, direccion, created_at, updated_at, user_id),
        clienteFinal: empresas!cliente_final_id (id, nombre, tipo, rut, sitio_web, direccion, created_at, updated_at, user_id),
        presupuestos (
          id,
          estado,
          facturado,
          total,
          created_at,
          fecha_envio,
          fecha_aprobacion,
          fecha_rechazo,
          fecha_vencimiento,
          nombre,
          negocio_id,
          updated_at
        )
      `)
      .single();

    if (error) {
      console.error("Error updating negocio state:", error);
      throw error;
    }

    // Transform the data properly to match ExtendedNegocio
    const transformedNegocio = {
      ...data,
      evento: {
        tipoEvento: data.tipo_evento,
        nombreEvento: data.nombre_evento,
        fechaEvento: data.fecha_evento,
        horasAcreditacion: data.horas_acreditacion,
        cantidadAsistentes: data.cantidad_asistentes || 0,
        cantidadInvitados: data.cantidad_invitados || 0,
        locacion: data.locacion
      },
      fechaCreacion: data.created_at,
      fechaCierre: data.fecha_cierre,
      presupuestos: data.presupuestos?.map(p => ({
        ...p,
        fechaCreacion: p.created_at,
        fechaEnvio: p.fecha_envio,
        fechaAprobacion: p.fecha_aprobacion,
        fechaRechazo: p.fecha_rechazo,
        fechaVencimiento: p.fecha_vencimiento
      })) || []
    };

    return transformedNegocio as Negocio;
  } catch (error) {
    console.error("Failed to update negocio state:", error);
    return null;
  }
};
