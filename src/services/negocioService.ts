
import { supabase } from '@/integrations/supabase/client';
import { Negocio } from '@/types';

export const obtenerNegociosDesdeSupabase = async (): Promise<Negocio[]> => {
  try {
    console.log('[NegocioService] ==> FETCHING NEGOCIOS FROM DATABASE <==');
    
    const { data, error } = await supabase
      .from('negocios')
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[NegocioService] Error fetching negocios:", error);
      throw error;
    }
    
    console.log('[NegocioService] Raw data from database:', {
      count: data?.length || 0,
      sample: data?.[0] ? {
        id: data[0].id,
        numero: data[0].numero,
        contacto: data[0].contacto?.nombre
      } : 'No data'
    });
    
    // Transform the data to match ExtendedNegocio type
    const transformedData = data.map((negocio, index) => {
      const transformed = {
        ...negocio,
        // Add required legacy properties for backwards compatibility
        evento: {
          tipoEvento: negocio.tipo_evento,
          nombreEvento: negocio.nombre_evento,
          fechaEvento: negocio.fecha_evento,
          horasAcreditacion: negocio.horas_acreditacion,
          cantidadAsistentes: negocio.cantidad_asistentes || 0,
          cantidadInvitados: negocio.cantidad_invitados || 0,
          locacion: negocio.locacion
        },
        fechaCreacion: negocio.created_at,
        fechaCierre: negocio.fecha_cierre,
        presupuestos: negocio.presupuestos?.map(p => ({
          ...p,
          fechaCreacion: p.created_at,
          fechaEnvio: p.fecha_envio,
          fechaAprobacion: p.fecha_aprobacion,
          fechaRechazo: p.fecha_rechazo,
          fechaVencimiento: p.fecha_vencimiento
        })) || []
      };
      
      console.log(`[NegocioService] Transformed negocio ${index}:`, {
        originalId: negocio.id,
        transformedId: transformed.id,
        numero: transformed.numero,
        contacto: transformed.contacto?.nombre,
        evento: transformed.evento?.nombreEvento,
        idMatch: negocio.id === transformed.id
      });
      
      return transformed;
    });
    
    console.log('[NegocioService] ==> TRANSFORMATION COMPLETE <==');
    console.log('[NegocioService] Final transformed data:', {
      count: transformedData.length,
      ids: transformedData.map(n => ({ id: n.id, numero: n.numero }))
    });
    
    return transformedData as Negocio[];
  } catch (error) {
    console.error("[NegocioService] Failed to fetch negocios:", error);
    throw error;
  }
};
