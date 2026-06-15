import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateQuoteName } from '@/utils/quoteNameGenerator';

// Function to trigger HubSpot amount sync
const triggerHubSpotAmountSync = async (negocioId: string) => {
  try {
    console.log('💰 [Presupuesto Actions] Triggering HubSpot amount sync for negocio:', negocioId);
    
    const { error } = await supabase.functions.invoke('hubspot-deal-amount-update', {
      body: { 
        negocio_id: negocioId,
        trigger_source: 'presupuesto_facturado'
      }
    });

    if (error) {
      console.error('❌ [Presupuesto Actions] Error syncing amount to HubSpot:', error);
    } else {
      console.log('✅ [Presupuesto Actions] Amount sync triggered successfully');
    }
  } catch (error) {
    console.error('❌ [Presupuesto Actions] Unexpected error during amount sync:', error);
  }
};

export const usePresupuestoActions = (negocioId: string, onRefresh: () => void) => {
  const [loading, setLoading] = useState(false);

  const marcarComoFacturado = async (presupuestoId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('marcar_presupuesto_facturado', {
        presupuesto_id_param: presupuestoId
      });

      if (error) throw error;

      toast.success('Presupuesto marcado como facturado');
      
      // Trigger HubSpot amount sync after marking as invoiced
      await triggerHubSpotAmountSync(negocioId);
      
      onRefresh();
    } catch (error) {
      console.error('Error al marcar presupuesto como facturado:', error);
      toast.error('Error al marcar como facturado');
    } finally {
      setLoading(false);
    }
  };

  const clonarPresupuesto = async (presupuestoId: string) => {
    setLoading(true);
    try {
      // Obtener presupuesto original
      const { data: presupuesto, error: pError } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('id', presupuestoId)
        .single();
      if (pError || !presupuesto) throw pError || new Error('Presupuesto no encontrado');

      // Obtener productos del presupuesto
      const { data: productos, error: prodError } = await supabase
        .from('productos_presupuesto')
        .select('*')
        .eq('presupuesto_id', presupuestoId);
      if (prodError) throw prodError;
      if (!Array.isArray(productos)) {
        throw new Error('No se pudieron leer las líneas del presupuesto original');
      }

      console.log('[clonarPresupuesto] productos origen:', productos.length);

      // Crear nuevo presupuesto en estado borrador con nombre correlativo
      // Obtener negocio y presupuestos existentes para generar nombre
      const { data: negocioData, error: nError } = await supabase
        .from('negocios')
        .select('numero')
        .eq('id', presupuesto.negocio_id)
        .maybeSingle();
      if (nError || !negocioData) throw nError || new Error('Negocio no encontrado');

      const { data: existingQuotes, error: qError } = await supabase
        .from('presupuestos')
        .select('nombre')
        .eq('negocio_id', presupuesto.negocio_id);
      if (qError) throw qError;

      const newName = generateQuoteName({ numero: negocioData.numero } as any, existingQuotes || []);

      const { data: nuevoPresupuesto, error: insertError } = await supabase
        .from('presupuestos')
        .insert({
          nombre: newName,
          estado: 'borrador',
          negocio_id: presupuesto.negocio_id,
          total: presupuesto.total || 0,
          facturado: false
        })
        .select()
        .single();
      if (insertError || !nuevoPresupuesto) throw insertError || new Error('No se pudo crear el presupuesto clonado');
      // Clonar productos si existen
      if (productos.length > 0) {
        const productosClonados = productos.map((p: any) => {
          // Normalizar sessions: si viene como array/objeto no vacío, stringify; si está vacío o nulo, null
          let sessionsValue: string | null = null;
          const raw = p.sessions;
          if (raw !== null && raw !== undefined) {
            try {
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
              if (Array.isArray(parsed) && parsed.length > 0) {
                sessionsValue = JSON.stringify(parsed);
              }
            } catch {
              sessionsValue = null;
            }
          }

          return {
            nombre: p.nombre,
            descripcion: p.descripcion ?? '',
            cantidad: p.cantidad,
            precio_unitario: p.precio_unitario,
            descuento_porcentaje: p.descuento_porcentaje ?? 0,
            total: p.total ?? 0,
            comentarios: p.comentarios ?? '',
            sessions: sessionsValue,
            precio_final_manual: p.precio_final_manual ?? null,
            presupuesto_id: nuevoPresupuesto.id,
          };
        });

        const { data: insertedRows, error: prodInsertError } = await supabase
          .from('productos_presupuesto')
          .insert(productosClonados)
          .select('id');

        if (prodInsertError || !insertedRows || insertedRows.length !== productos.length) {
          console.error('[clonarPresupuesto] Falló insert de productos, haciendo rollback', {
            error: prodInsertError,
            esperados: productos.length,
            insertados: insertedRows?.length ?? 0,
          });
          await supabase.from('presupuestos').delete().eq('id', nuevoPresupuesto.id);
          throw prodInsertError || new Error('No se pudieron clonar todas las líneas del presupuesto');
        }

        console.log('[clonarPresupuesto] productos clonados:', insertedRows.length);
      }

      await Promise.resolve(onRefresh());
      toast.success('Presupuesto clonado como borrador');
    } catch (error: any) {
      console.error('Error al clonar presupuesto:', error);
      toast.error(`Error al clonar presupuesto: ${error?.message ?? 'desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    marcarComoFacturado,
    clonarPresupuesto,
    loading
  };
};