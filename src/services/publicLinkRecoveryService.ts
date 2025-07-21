
import { supabase } from '@/integrations/supabase/client';

interface PresupuestoSinLink {
  id: string;
  nombre: string;
  estado: string;
  facturado: boolean;
  negocio_id: string;
  total: number;
}

export const publicLinkRecoveryService = {
  // Función para encontrar presupuestos elegibles sin link
  async findPresupuestosSinLink(): Promise<PresupuestoSinLink[]> {
    console.log('🔍 [Link Recovery] Buscando presupuestos sin link...');
    
    try {
      // Buscar presupuestos aprobados, facturados o publicados
      const { data: presupuestos, error: presupuestosError } = await supabase
        .from('presupuestos')
        .select('id, nombre, estado, facturado, negocio_id, total')
        .or('estado.eq.aprobado,estado.eq.publicado,facturado.eq.true');

      if (presupuestosError) {
        console.error('❌ [Link Recovery] Error fetching presupuestos:', presupuestosError);
        return [];
      }

      if (!presupuestos || presupuestos.length === 0) {
        console.log('ℹ️ [Link Recovery] No se encontraron presupuestos elegibles');
        return [];
      }

      // Obtener links existentes para estos presupuestos
      const presupuestoIds = presupuestos.map(p => p.id);
      const { data: existingLinks, error: linksError } = await supabase
        .from('public_budget_links')
        .select('presupuesto_id')
        .in('presupuesto_id', presupuestoIds)
        .eq('is_active', true);

      if (linksError) {
        console.error('❌ [Link Recovery] Error fetching existing links:', linksError);
        return [];
      }

      const existingLinkIds = new Set(existingLinks?.map(link => link.presupuesto_id) || []);
      
      // Filtrar presupuestos sin link
      const presupuestosSinLink = presupuestos.filter(p => !existingLinkIds.has(p.id));
      
      console.log(`🔍 [Link Recovery] Encontrados ${presupuestosSinLink.length} presupuestos sin link:`, 
        presupuestosSinLink.map(p => ({ id: p.id, nombre: p.nombre, estado: p.estado, facturado: p.facturado }))
      );
      
      return presupuestosSinLink;
    } catch (error) {
      console.error('❌ [Link Recovery] Error en búsqueda:', error);
      return [];
    }
  },

  // Función para crear link para un presupuesto específico
  async createLinkForPresupuesto(presupuestoId: string, negocioId: string): Promise<boolean> {
    console.log(`🔗 [Link Recovery] Creando link para presupuesto ${presupuestoId}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-link-manager', {
        body: {
          presupuesto_id: presupuestoId,
          negocio_id: negocioId,
          regenerate: false,
          recovery_mode: true
        }
      });

      if (error) {
        console.error(`❌ [Link Recovery] Error creando link para ${presupuestoId}:`, error);
        return false;
      }

      if (!data?.success) {
        console.error(`❌ [Link Recovery] Fallo creando link para ${presupuestoId}:`, data?.error);
        return false;
      }

      console.log(`✅ [Link Recovery] Link creado exitosamente para ${presupuestoId}`);
      console.log(`📊 [Link Recovery] HubSpot sync result:`, {
        presupuesto_id: presupuestoId,
        hubspot_updated: data.hubspot_updated,
        hubspot_property: data.hubspot_property
      });
      
      return true;
    } catch (error) {
      console.error(`❌ [Link Recovery] Error inesperado creando link para ${presupuestoId}:`, error);
      return false;
    }
  },

  // Función para recuperar todos los links faltantes
  async recoverAllMissingLinks(): Promise<{ success: number; failed: number; total: number }> {
    console.log('🚀 [Link Recovery] Iniciando recuperación masiva de links...');
    
    const presupuestosSinLink = await this.findPresupuestosSinLink();
    
    if (presupuestosSinLink.length === 0) {
      console.log('✅ [Link Recovery] No hay presupuestos sin link para recuperar');
      return { success: 0, failed: 0, total: 0 };
    }

    let success = 0;
    let failed = 0;

    for (const presupuesto of presupuestosSinLink) {
      console.log(`🔄 [Link Recovery] Procesando presupuesto: ${presupuesto.nombre} (${presupuesto.id})`);
      
      const created = await this.createLinkForPresupuesto(presupuesto.id, presupuesto.negocio_id);
      
      if (created) {
        success++;
        console.log(`✅ [Link Recovery] Éxito: ${presupuesto.nombre}`);
      } else {
        failed++;
        console.log(`❌ [Link Recovery] Fallo: ${presupuesto.nombre}`);
      }

      // Pequeña pausa entre creaciones para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`📊 [Link Recovery] Recuperación completada: ${success} exitosos, ${failed} fallidos de ${presupuestosSinLink.length} total`);
    
    return {
      success,
      failed,
      total: presupuestosSinLink.length
    };
  },

  // Función para verificar el estado de un presupuesto específico
  async checkPresupuestoLinkStatus(presupuestoId: string): Promise<{
    hasLink: boolean;
    isEligible: boolean;
    presupuesto?: any;
    link?: any;
  }> {
    console.log(`🔍 [Link Recovery] Verificando estado del presupuesto ${presupuestoId}...`);
    
    try {
      // Obtener datos del presupuesto
      const { data: presupuesto, error: presupuestoError } = await supabase
        .from('presupuestos')
        .select('id, nombre, estado, facturado, negocio_id, total')
        .eq('id', presupuestoId)
        .single();

      if (presupuestoError || !presupuesto) {
        console.error('❌ [Link Recovery] Presupuesto no encontrado:', presupuestoError);
        return { hasLink: false, isEligible: false };
      }

      // Verificar si es elegible para link público
      const isEligible = presupuesto.estado === 'publicado' || 
                        presupuesto.estado === 'aprobado' || 
                        presupuesto.facturado;

      // Buscar link existente
      const { data: link, error: linkError } = await supabase
        .from('public_budget_links')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .eq('is_active', true)
        .maybeSingle();

      if (linkError) {
        console.error('❌ [Link Recovery] Error buscando link:', linkError);
      }

      const result = {
        hasLink: !!link,
        isEligible,
        presupuesto,
        link: link || undefined
      };

      console.log(`📋 [Link Recovery] Estado del presupuesto ${presupuestoId}:`, result);
      
      return result;
    } catch (error) {
      console.error('❌ [Link Recovery] Error verificando estado:', error);
      return { hasLink: false, isEligible: false };
    }
  }
};
