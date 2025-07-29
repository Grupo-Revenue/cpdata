
import { supabase } from '@/integrations/supabase/client';
import { Negocio } from '@/types';
import { logger } from '@/utils/logger';

export const obtenerNegociosDesdeSupabase = async (): Promise<Negocio[]> => {
  try {
    console.log('[negocioService] ==> STARTING FETCH FROM SUPABASE <==');
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
            sessions,
            descuento_porcentaje,
            comentarios
          )
        )
      `)
      .order('created_at', { ascending: false });

    console.log('[negocioService] Raw Supabase response:', { data, error, dataCount: data?.length });

    if (error) {
      console.error('[negocioService] Supabase error:', error);
      logger.error('Error fetching negocios from Supabase', error);
      throw error;
    }
    
    console.log('[negocioService] Successfully fetched negocios', { count: data?.length || 0 });
    logger.debug('Successfully fetched negocios', { count: data?.length || 0 });
    
    // Transform the data to match ExtendedNegocio type
    const transformedData = data.map((negocio, index) => {
      console.log(`[negocioService] Transforming negocio ${index + 1}:`, {
        id: negocio.id,
        numero: negocio.numero,
        nombre_evento: negocio.nombre_evento,
        contacto: negocio.contacto?.nombre
      });
      
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
              comentarios: producto.comentarios || '',
              descuentoPorcentaje: producto.descuento_porcentaje || 0,
              precioUnitario: producto.precio_unitario,
              sessions: parsedSessions
            };
          }) || []
        })) || []
      };
      
      return transformed;
    });
    
    console.log('[negocioService] ==> TRANSFORMATION COMPLETE <==', {
      totalBusinesses: transformedData.length,
      totalQuotes: transformedData.reduce((sum, n) => sum + n.presupuestos.length, 0),
      firstBusiness: transformedData[0] ? {
        id: transformedData[0].id,
        numero: transformedData[0].numero,
        evento: transformedData[0].evento?.nombreEvento
      } : 'none'
    });
    
    logger.debug('Transformation complete', {
      totalBusinesses: transformedData.length,
      totalQuotes: transformedData.reduce((sum, n) => sum + n.presupuestos.length, 0)
    });
    
    return transformedData as Negocio[];
  } catch (error) {
    console.error('[negocioService] ==> FAILED TO FETCH NEGOCIOS <==', error);
    logger.error('Failed to fetch negocios', error);
    throw error;
  }
};
