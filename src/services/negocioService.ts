
import { supabase } from '@/integrations/supabase/client';
import { Negocio } from '@/types';

export const obtenerNegociosDesdeSupabase = async (): Promise<Negocio[]> => {
  try {
    console.log('[NegocioService] ==> FETCHING NEGOCIOS FROM DATABASE <==');
    console.log('[NegocioService] Timestamp:', new Date().toISOString());
    
    // Add cache-busting parameter to ensure fresh data
    const cacheKey = Date.now();
    console.log('[NegocioService] Cache key:', cacheKey);
    
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
    
    console.log('[NegocioService] Raw data received:', {
      count: data?.length || 0,
      timestamp: new Date().toISOString(),
      firstBusinessQuotes: data?.[0] ? {
        businessId: data[0].id,
        businessNumber: data[0].numero,
        quotesCount: data[0].presupuestos?.length || 0,
        quotes: data[0].presupuestos?.map(p => ({ 
          id: p.id, 
          name: p.nombre, 
          updated_at: p.updated_at 
        })) || []
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
      
      console.log(`[NegocioService] Transformed negocio ${index + 1}/${data.length}:`, {
        id: transformed.id,
        numero: transformed.numero,
        quotesCount: transformed.presupuestos.length,
        quoteNames: transformed.presupuestos.map(p => p.nombre),
        lastUpdated: transformed.updated_at
      });
      
      return transformed;
    });
    
    console.log('[NegocioService] ==> TRANSFORMATION COMPLETE <==');
    console.log('[NegocioService] Final summary:', {
      totalBusinesses: transformedData.length,
      totalQuotes: transformedData.reduce((sum, n) => sum + n.presupuestos.length, 0),
      businessesWithQuotes: transformedData.filter(n => n.presupuestos.length > 0).length,
      timestamp: new Date().toISOString()
    });
    
    return transformedData as Negocio[];
  } catch (error) {
    console.error("[NegocioService] Failed to fetch negocios:", error);
    throw error;
  }
};
