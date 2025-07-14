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
      console.log('[usePublicBudgetData] Starting fetch process...');
      console.log('[usePublicBudgetData] Input validation:', { 
        negocioId, 
        presupuestoId,
        negocioIdType: typeof negocioId,
        presupuestoIdType: typeof presupuestoId,
        negocioIdLength: negocioId?.length,
        presupuestoIdLength: presupuestoId?.length
      });
      
      if (!negocioId || !presupuestoId) {
        console.error('[usePublicBudgetData] Missing required parameters');
        setData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'IDs de negocio y presupuesto son requeridos' 
        }));
        return;
      }

      console.log('[usePublicBudgetData] Setting loading state...');
      setData(prev => ({ ...prev, loading: true, error: null }));

      try {
        console.log('[usePublicBudgetData] Calling Supabase RPC function...');
        console.log('[usePublicBudgetData] Parameters:', { 
          p_negocio_id: negocioId, 
          p_presupuesto_id: presupuestoId 
        });

        // Use the secure function that bypasses RLS for public access
        const { data: publicData, error: publicError } = await supabase
          .rpc('get_public_budget_data', {
            p_negocio_id: negocioId,
            p_presupuesto_id: presupuestoId
          });

        console.log('[usePublicBudgetData] RPC call completed');
        console.log('[usePublicBudgetData] Response data:', publicData);
        console.log('[usePublicBudgetData] Response error:', publicError);

        if (publicError) {
          console.error('[usePublicBudgetData] RPC error details:', {
            message: publicError.message,
            details: publicError.details,
            hint: publicError.hint,
            code: publicError.code
          });
          throw new Error(`Error al consultar datos públicos: ${publicError.message}`);
        }

        if (!publicData || publicData.length === 0) {
          console.warn('[usePublicBudgetData] No data returned from RPC');
          console.warn('[usePublicBudgetData] This could mean:');
          console.warn('  - Budget does not exist');
          console.warn('  - Budget is not in "publicado" or "aprobado" state');
          console.warn('  - Negocio does not exist');
          throw new Error('Presupuesto no encontrado o no disponible públicamente');
        }

        console.log('[usePublicBudgetData] Data array length:', publicData.length);
        const result = publicData[0];
        console.log('[usePublicBudgetData] First result structure:', Object.keys(result || {}));
        
        const { presupuesto_data: rawPresupuestoData, negocio_data: rawNegocioData } = result;
        
        console.log('[usePublicBudgetData] Extracted raw data:', { 
          presupuestoExists: !!rawPresupuestoData,
          negocioExists: !!rawNegocioData,
          presupuestoDataType: typeof rawPresupuestoData,
          negocioDataType: typeof rawNegocioData
        });

        if (!rawPresupuestoData || !rawNegocioData) {
          console.error('[usePublicBudgetData] Missing data in response:', {
            rawPresupuestoData: !!rawPresupuestoData,
            rawNegocioData: !!rawNegocioData,
            fullResult: result
          });
          throw new Error('Datos incompletos recibidos');
        }

        // Type the JSONB data properly
        const presupuestoData = rawPresupuestoData as any;
        const negocioData = rawNegocioData as any;

        // Transform the data to match expected format
        const productos: ExtendedProductoPresupuesto[] = (presupuestoData.productos_presupuesto || []).map((p: any) => ({
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

        console.log('[usePublicBudgetData] Setting final data state...');
        console.log('[usePublicBudgetData] Transformed presupuesto:', transformedPresupuesto.nombre);
        console.log('[usePublicBudgetData] Transformed negocio:', transformedNegocio.numero);
        
        setData({
          presupuesto: transformedPresupuesto,
          negocio: transformedNegocio,
          loading: false,
          error: null
        });

        console.log('[usePublicBudgetData] Data fetch completed successfully');

      } catch (error) {
        console.error('[usePublicBudgetData] Error in fetch process:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
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