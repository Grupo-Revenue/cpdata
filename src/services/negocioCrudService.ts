
import { supabase } from '@/integrations/supabase/client';
import { Negocio, EstadoNegocio } from '@/types';

// Helper function to find or create contact
const findOrCreateContact = async (contactData: any, userId: string) => {
  // First try to find existing contact
  const { data: existingContact, error: findError } = await supabase
    .from('contactos')
    .select('id')
    .eq('user_id', userId)
    .eq('email', contactData.email)
    .maybeSingle();

  if (findError) throw findError;
  
  if (existingContact) {
    return existingContact.id;
  }

  // Create new contact if not found
  const { data: newContact, error: createError } = await supabase
    .from('contactos')
    .insert([{
      ...contactData,
      user_id: userId
    }])
    .select('id')
    .single();

  if (createError) throw createError;
  return newContact.id;
};

// Helper function to find or create company
const findOrCreateCompany = async (companyData: any, userId: string) => {
  // First try to find existing company
  const { data: existingCompany, error: findError } = await supabase
    .from('empresas')
    .select('id')
    .eq('user_id', userId)
    .eq('nombre', companyData.nombre)
    .eq('tipo', companyData.tipo)
    .maybeSingle();

  if (findError) throw findError;
  
  if (existingCompany) {
    return existingCompany.id;
  }

  // Create new company if not found
  const { data: newCompany, error: createError } = await supabase
    .from('empresas')
    .insert([{
      ...companyData,
      user_id: userId
    }])
    .select('id')
    .single();

  if (createError) throw createError;
  return newCompany.id;
};

export const crearNegocioEnSupabase = async (negocioData: any): Promise<Negocio | null> => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    // Handle contact - find or create
    let contactoId = null;
    if (negocioData.contacto) {
      contactoId = await findOrCreateContact(negocioData.contacto, userId);
    }

    // Handle productora - find or create
    let productoraId = null;
    if (negocioData.productora) {
      productoraId = await findOrCreateCompany(negocioData.productora, userId);
    }

    // Handle cliente final - find or create
    let clienteFinalId = null;
    if (negocioData.clienteFinal) {
      clienteFinalId = await findOrCreateCompany(negocioData.clienteFinal, userId);
    }

    // Get next business number
    const { data: counterData, error: counterError } = await supabase
      .from('contadores_usuario')
      .select('contador_negocio')
      .eq('user_id', userId)
      .single();

    if (counterError) throw counterError;

    // Create the negocio
    const { data, error } = await supabase
      .from('negocios')
      .insert([{
        user_id: userId,
        numero: counterData.contador_negocio,
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
      throw error;
    }

    // Update counter
    await supabase
      .from('contadores_usuario')
      .update({ contador_negocio: counterData.contador_negocio + 1 })
      .eq('user_id', userId);

    // Transform the data to match ExtendedNegocio type
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
