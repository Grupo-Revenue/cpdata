
import { supabase } from '@/integrations/supabase/client';
import { Negocio } from '@/types';
import { logger } from '@/utils/logger';

export const obtenerNegociosDesdeSupabase = async (): Promise<Negocio[]> => {
  try {
    logger.debug('Fetching negocios from database');
    
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
      logger.error('Error fetching negocios from Supabase', error);
      throw error;
    }
    
    logger.debug('Successfully fetched negocios', { count: data?.length || 0 });
    
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
      
      return transformed;
    });
    
    logger.debug('Transformation complete', {
      totalBusinesses: transformedData.length,
      totalQuotes: transformedData.reduce((sum, n) => sum + n.presupuestos.length, 0)
    });
    
    return transformedData as Negocio[];
  } catch (error) {
    logger.error('Failed to fetch negocios', error);
    throw error;
  }
};
