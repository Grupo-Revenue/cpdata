import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Presupuesto, Negocio, ExtendedProductoPresupuesto, SessionAcreditacion } from '@/types';

interface PublicBudgetData {
  presupuesto: Presupuesto | null;
  negocio: Negocio | null;
  loading: boolean;
  error: string | null;
}

export const usePublicBudgetData = (negocioId: string, presupuestoId: string): PublicBudgetData => {
  const [data, setData] = useState<PublicBudgetData>({
    presupuesto: null,
    negocio: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchPublicBudgetData = async () => {
      if (!negocioId || !presupuestoId) {
        setData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'IDs de negocio y presupuesto son requeridos' 
        }));
        return;
      }

      setData(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Fetch presupuesto with products
        const { data: presupuestoData, error: presupuestoError } = await supabase
          .from('presupuestos')
          .select(`
            *,
            productos_presupuesto (*)
          `)
          .eq('id', presupuestoId)
          .in('estado', ['publicado', 'aprobado']) // Allow published and approved budgets
          .single();

        if (presupuestoError) {
          throw new Error('Presupuesto no encontrado o no disponible públicamente');
        }

        // Fetch negocio with related data
        const { data: negocioData, error: negocioError } = await supabase
          .from('negocios')
          .select(`
            *,
            contactos!negocios_contacto_id_fkey (*),
            empresas!negocios_productora_id_fkey (*),
            cliente_final:empresas!negocios_cliente_final_id_fkey (*)
          `)
          .eq('id', negocioId)
          .single();

        if (negocioError) {
          throw new Error('Negocio no encontrado');
        }

        // Transform the data to match expected format
        const productos: ExtendedProductoPresupuesto[] = (presupuestoData.productos_presupuesto || []).map(p => ({
          ...p,
          sessions: Array.isArray(p.sessions) ? p.sessions as SessionAcreditacion[] : [],
          comentarios: undefined,
          descuentoPorcentaje: 0, // Set default value instead of undefined
          precioUnitario: p.precio_unitario,
          linea_producto_id: undefined,
          originalLibraryDescription: undefined
        }));

        const transformedPresupuesto: Presupuesto = {
          ...presupuestoData,
          productos,
          fechaCreacion: presupuestoData.created_at,
          fechaEnvio: presupuestoData.fecha_envio || undefined,
          fechaAprobacion: presupuestoData.fecha_aprobacion || undefined,
          fechaRechazo: presupuestoData.fecha_rechazo || undefined,
          fechaVencimiento: presupuestoData.fecha_vencimiento || undefined
        };

        const transformedNegocio: Negocio = {
          ...negocioData,
          contacto: negocioData.contactos,
          productora: negocioData.empresas,
          clienteFinal: negocioData.cliente_final,
          evento: {
            nombreEvento: negocioData.nombre_evento,
            tipoEvento: negocioData.tipo_evento,
            fechaEvento: negocioData.fecha_evento,
            locacion: negocioData.locacion,
            cantidadInvitados: negocioData.cantidad_invitados || 0,
            cantidadAsistentes: negocioData.cantidad_asistentes || 0,
            horasAcreditacion: negocioData.horas_acreditacion
          },
          fechaCreacion: negocioData.created_at,
          fechaCierre: negocioData.fecha_cierre || undefined,
          presupuestos: [transformedPresupuesto]
        };

        setData({
          presupuesto: transformedPresupuesto,
          negocio: transformedNegocio,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching public budget data:', error);
        setData({
          presupuesto: null,
          negocio: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Error al cargar los datos'
        });
      }
    };

    fetchPublicBudgetData();
  }, [negocioId, presupuestoId]);

  return data;
};