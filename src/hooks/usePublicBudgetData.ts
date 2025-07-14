import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Presupuesto, Negocio } from '@/types';

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
          .eq('estado', 'publicado') // Only allow published budgets
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
        const transformedPresupuesto: Presupuesto = {
          ...presupuestoData,
          productos: presupuestoData.productos_presupuesto || []
        };

        const transformedNegocio: Negocio = {
          id: negocioData.id,
          numero: negocioData.numero,
          estado: negocioData.estado,
          created_at: negocioData.created_at,
          updated_at: negocioData.updated_at,
          hubspot_id: negocioData.hubspot_id,
          fecha_cierre: negocioData.fecha_cierre,
          contacto: negocioData.contactos,
          productora: negocioData.empresas,
          clienteFinal: negocioData.cliente_final,
          evento: {
            nombreEvento: negocioData.nombre_evento,
            tipoEvento: negocioData.tipo_evento,
            fechaEvento: negocioData.fecha_evento,
            locacion: negocioData.locacion,
            cantidadInvitados: negocioData.cantidad_invitados,
            cantidadAsistentes: negocioData.cantidad_asistentes,
            horasAcreditacion: negocioData.horas_acreditacion
          },
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