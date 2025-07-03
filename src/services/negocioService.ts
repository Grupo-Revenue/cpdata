
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
          updated_at,
          productos: productos_presupuesto (
            id,
            nombre,
            descripcion,
            cantidad,
            precio_unitario,
            total,
            created_at,
            presupuesto_id,
            sessions
          )
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
          fechaVencimiento: p.fecha_vencimiento,
          productos: p.productos?.map(producto => {
            console.log(`Loading product ${producto.nombre}:`, {
              sessions: producto.sessions,
              sessionType: typeof producto.sessions,
              sessionLength: Array.isArray(producto.sessions) ? producto.sessions.length : 'not array'
            });
            
            let parsedSessions;
            try {
              // Handle different session data formats
              if (producto.sessions === null || producto.sessions === undefined) {
                parsedSessions = undefined;
              } else if (typeof producto.sessions === 'string') {
                parsedSessions = JSON.parse(producto.sessions);
              } else if (Array.isArray(producto.sessions)) {
                parsedSessions = producto.sessions;
              } else if (typeof producto.sessions === 'object') {
                // Check for malformed objects and treat them as undefined
                if (producto.sessions._type === 'undefined' || Object.keys(producto.sessions).length === 0) {
                  parsedSessions = undefined;
                } else {
                  parsedSessions = producto.sessions;
                }
              } else {
                parsedSessions = undefined;
              }
            } catch (error) {
              console.error(`Error parsing sessions for product ${producto.nombre}:`, error);
              parsedSessions = undefined;
            }
            
            return {
              ...producto,
              comentarios: '',
              descuentoPorcentaje: 0,
              precioUnitario: producto.precio_unitario,
              sessions: parsedSessions
            };
          }) || []
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
