import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Negocio, Presupuesto, EstadoNegocio, EstadoPresupuesto, ProductoPresupuesto } from '@/types';
import { obtenerNegociosDesdeSupabase } from '@/services/negocioService';
import { 
  crearNegocioEnSupabase, 
  actualizarNegocioEnSupabase, 
  eliminarNegocioEnSupabase, 
  cambiarEstadoNegocioEnSupabase 
} from '@/services/negocioCrudService';
import {
  crearPresupuestoEnSupabase,
  actualizarPresupuestoEnSupabase,
  eliminarPresupuestoEnSupabase,
  cambiarEstadoPresupuestoEnSupabase
} from '@/services/presupuestoService';
import { useHubSpotDealStageSync } from '@/hooks/hubspot/useHubSpotDealStageSync';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';


interface NegocioContextProps {
  negocios: Negocio[];
  loading: boolean;
  error: string | null;
  obtenerNegocio: (id: string) => Negocio | undefined;
  crearNegocio: (negocioData: any) => Promise<Negocio | null>;
  actualizarNegocio: (id: string, updates: Partial<Negocio>) => Promise<Negocio | null>;
  eliminarNegocio: (id: string) => Promise<boolean>;
  crearPresupuesto: (negocioId: string, presupuestoData: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>) => Promise<Presupuesto | null>;
  actualizarPresupuesto: (negocioId: string, presupuestoId: string, updates: Partial<Presupuesto>, productos?: ProductoPresupuesto[]) => Promise<Presupuesto | null>;
  eliminarPresupuesto: (negocioId: string, presupuestoId: string) => Promise<boolean>;
  cambiarEstadoPresupuesto: (negocioId: string, presupuestoId: string, nuevoEstado: EstadoPresupuesto, fechaVencimiento?: string) => Promise<void>;
  cambiarEstadoNegocio: (negocioId: string, nuevoEstado: EstadoNegocio) => Promise<void>;
  refreshNegocios: () => Promise<void>;
}

const NegocioContext = createContext<NegocioContextProps | undefined>(undefined);

const NegocioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { syncDealStage } = useHubSpotDealStageSync();
  const { user } = useAuth();


  const obtenerNegocios = useCallback(async (forceRefresh = false) => {
    console.log('[NegocioContext] ==> LOADING NEGOCIOS <==');
    console.log('[NegocioContext] Force refresh:', forceRefresh);
    console.log('[NegocioContext] Current state before fetch:', {
      negociosCount: negocios.length,
      loading,
      error
    });
    
    setLoading(true);
    try {
      const negociosData = await obtenerNegociosDesdeSupabase();
      console.log('[NegocioContext] Received negocios data:', {
        count: negociosData.length,
        timestamp: new Date().toISOString(),
        firstFew: negociosData.slice(0, 3).map(n => ({ 
          id: n.id, 
          numero: n.numero,
          quotesCount: n.presupuestos?.length || 0,
          quoteNames: n.presupuestos?.map(p => p.nombre) || []
        }))
      });
      
      // Always update state to ensure UI refresh
      setNegocios(negociosData);
      setError(null);
      
      console.log('[NegocioContext] State updated successfully');
    } catch (e: any) {
      console.error('[NegocioContext] Error loading negocios:', e);
      setError(e.message || "Error al cargar los negocios");
      setNegocios([]);
    } finally {
      setLoading(false);
      console.log('[NegocioContext] ==> LOADING COMPLETE <==');
    }
  }, []);

  useEffect(() => {
    console.log('[NegocioContext] ==> COMPONENT MOUNTED, TRIGGERING INITIAL LOAD <==');
    obtenerNegocios();
  }, [obtenerNegocios]);

  const refreshNegocios = async () => {
    console.log('[NegocioContext] ==> MANUAL REFRESH REQUESTED <==');
    console.log('[NegocioContext] Current state before refresh:', {
      negociosCount: negocios.length,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Force a complete refresh - clear state first to ensure re-render
      setNegocios([]);
      setLoading(true);
      await obtenerNegocios(true);
      console.log('[NegocioContext] Manual refresh completed successfully');
    } catch (error) {
      console.error('[NegocioContext] Error during manual refresh:', error);
      throw error; // Re-throw to allow caller to handle
    }
  };

  const obtenerNegocio = (id: string): Negocio | undefined => {
    console.log('[NegocioContext] ==> SEARCHING FOR NEGOCIO <==');
    console.log('[NegocioContext] Searching for ID:', id);
    console.log('[NegocioContext] Available negocios:', negocios.length);
    
    const found = negocios.find(negocio => negocio.id === id);
    
    if (found) {
      console.log('[NegocioContext] Found negocio:', {
        id: found.id,
        numero: found.numero,
        quotesCount: found.presupuestos?.length || 0,
        quoteNames: found.presupuestos?.map(p => p.nombre) || []
      });
    } else {
      console.log('[NegocioContext] Negocio not found');
    }
    
    return found;
  };

  const crearNegocio = async (negocioData: any): Promise<Negocio | null> => {
    const nuevoNegocio = await crearNegocioEnSupabase(negocioData);
    if (nuevoNegocio) {
      setNegocios(prevNegocios => [nuevoNegocio, ...prevNegocios]);
    }
    return nuevoNegocio;
  };

  const actualizarNegocio = async (id: string, updates: Partial<Negocio>): Promise<Negocio | null> => {
    const negocioActualizado = await actualizarNegocioEnSupabase(id, updates);
    if (negocioActualizado) {
      setNegocios(prevNegocios =>
        prevNegocios.map(negocio => (negocio.id === id ? negocioActualizado : negocio))
      );
    }
    return negocioActualizado;
  };

  const eliminarNegocio = async (id: string): Promise<boolean> => {
    const eliminado = await eliminarNegocioEnSupabase(id);
    if (eliminado) {
      setNegocios(prevNegocios => prevNegocios.filter(negocio => negocio.id !== id));
    }
    return eliminado;
  };

  const crearPresupuesto = async (negocioId: string, presupuestoData: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>): Promise<Presupuesto | null> => {
    const nuevoPresupuesto = await crearPresupuestoEnSupabase(negocioId, presupuestoData);
    if (nuevoPresupuesto) {
      // Update the local state optimistically
      setNegocios(prevNegocios =>
        prevNegocios.map(negocio =>
          negocio.id === negocioId
            ? { 
                ...negocio, 
                presupuestos: [...(negocio.presupuestos || []), nuevoPresupuesto] 
              }
            : negocio
        )
      );
    }
    return nuevoPresupuesto;
  };

  const actualizarPresupuesto = async (negocioId: string, presupuestoId: string, updates: Partial<Presupuesto>, productos?: ProductoPresupuesto[]): Promise<Presupuesto | null> => {
    console.log('🔄 [NegocioContext] actualizarPresupuesto called with:', {
      negocioId,
      presupuestoId,
      updates,
      hasProductos: !!productos,
      productCount: productos?.length || 0,
      productsWithSessions: productos?.filter(p => p.sessions && p.sessions.length > 0).length || 0
    });
    
    const presupuestoActualizado = await actualizarPresupuestoEnSupabase(presupuestoId, updates, productos);
    
    if (presupuestoActualizado) {
      console.log('✅ [NegocioContext] Presupuesto updated successfully, refreshing from database...');
      
      // Force a complete refresh from the database to get fresh data including products with sessions
      await obtenerNegocios();
      
      console.log('🔄 [NegocioContext] Database refresh completed for immediate UI update');
    }
    
    return presupuestoActualizado;
  };

  const eliminarPresupuesto = async (negocioId: string, presupuestoId: string): Promise<boolean> => {
    try {
      console.log('🗑️ [NegocioContext] === INICIO ELIMINACIÓN PRESUPUESTO ===');
      console.log('🗑️ [NegocioContext] Eliminando presupuesto:', presupuestoId);
      console.log('🗑️ [NegocioContext] Usuario autenticado:', !!user);
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      // Get the current business to check budget count before deletion
      const negocioActual = obtenerNegocio(negocioId);
      const presupuestosAntesDeEliminar = negocioActual?.presupuestos?.length || 0;
      
      const eliminado = await eliminarPresupuestoEnSupabase(presupuestoId);
      if (eliminado) {
        // Optimistically update the negocios state
        setNegocios(prevNegocios =>
          prevNegocios.map(negocio =>
            negocio.id === negocioId
              ? {
                  ...negocio,
                  presupuestos: negocio.presupuestos.filter(presupuesto => presupuesto.id !== presupuestoId)
                }
              : negocio
          )
        );

        // Check if this deletion results in zero budgets
        const presupuestosAfterDeletion = presupuestosAntesDeEliminar - 1;
        
        if (presupuestosAfterDeletion === 0) {
          console.log('[NegocioContext] Business has zero budgets after deletion, refreshing page...');
          // Small delay to ensure the database trigger has processed
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
        
        console.log('✅ [NegocioContext] Presupuesto eliminado exitosamente');
        toast.success('Presupuesto eliminado correctamente');
        return true;
      } else {
        console.error('❌ [NegocioContext] No se pudo eliminar el presupuesto');
        toast.error('Error al eliminar el presupuesto');
        return false;
      }
    } catch (error) {
      console.error('❌ [NegocioContext] === ERROR ELIMINACIÓN PRESUPUESTO ===');
      console.error('❌ [NegocioContext] Error details:', error);
      
      let errorMessage = 'Error al eliminar el presupuesto';
      
      if (error instanceof Error) {
        if (error.message.includes('policy') || error.message.includes('permission')) {
          errorMessage = 'No tienes permisos para eliminar este presupuesto';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Presupuesto no encontrado';
        } else if (error.message.includes('autenticado')) {
          errorMessage = 'Debes iniciar sesión para realizar esta acción';
        }
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  const cambiarEstadoPresupuesto = async (negocioId: string, presupuestoId: string, nuevoEstado: EstadoPresupuesto, fechaVencimiento?: string): Promise<void> => {
    try {
      console.log('🔄 [NegocioContext] === INICIO CAMBIO ESTADO PRESUPUESTO ===');
      console.log('🔄 [NegocioContext] Parámetros:', { negocioId, presupuestoId, nuevoEstado, fechaVencimiento });
      console.log('🔄 [NegocioContext] Negocios disponibles en contexto:', negocios.length);
      console.log('🔄 [NegocioContext] Loading estado:', loading);
      
      // Validar que el negocio existe en el contexto
      const negocioActual = obtenerNegocio(negocioId);
      if (!negocioActual) {
        console.error('❌ [NegocioContext] Negocio no encontrado en contexto:', negocioId);
        console.error('❌ [NegocioContext] IDs disponibles:', negocios.map(n => n.id));
        throw new Error(`Negocio no encontrado en contexto: ${negocioId}`);
      }
      
      console.log('✅ [NegocioContext] Negocio encontrado:', { id: negocioActual.id, numero: negocioActual.numero });
      
      const estadoAnteriorNegocio = negocioActual.estado;
      console.log('📊 [NegocioContext] Estado anterior del negocio:', estadoAnteriorNegocio);
      
      // Validar que el presupuesto existe en el negocio
      const presupuestoActual = negocioActual.presupuestos?.find(p => p.id === presupuestoId);
      if (!presupuestoActual) {
        console.error('❌ [NegocioContext] Presupuesto no encontrado en negocio:', presupuestoId);
        throw new Error(`Presupuesto no encontrado: ${presupuestoId}`);
      }
      
      console.log('📝 [NegocioContext] Presupuesto encontrado:', { 
        id: presupuestoActual.id, 
        estado: presupuestoActual.estado, 
        facturado: presupuestoActual.facturado,
        nombre: presupuestoActual.nombre 
      });
      
      // Validar reglas de negocio para cambios de estado
      if (presupuestoActual.facturado) {
        console.error('❌ [NegocioContext] No se puede cambiar estado de presupuesto facturado');
        throw new Error('No se puede cambiar el estado de un presupuesto que ya ha sido facturado');
      }
      
      // Validar transiciones de estado válidas
      const transicionesValidas = {
        'borrador': ['publicado', 'cancelado'],
        'publicado': ['aprobado', 'rechazado', 'vencido', 'cancelado'],
        'aprobado': ['rechazado'], // Solo permitir rechazar desde aprobado si no está facturado
        'rechazado': ['aprobado'], // Permitir reactivar un presupuesto rechazado
        'vencido': ['aprobado'], // Permitir aprobar un presupuesto vencido
        'cancelado': ['borrador'] // Permitir reactivar un presupuesto cancelado
      };
      
      const transicionPermitida = transicionesValidas[presupuestoActual.estado]?.includes(nuevoEstado);
      if (!transicionPermitida) {
        console.error('❌ [NegocioContext] Transición de estado no válida:', {
          estadoActual: presupuestoActual.estado,
          nuevoEstado,
          transicionesPermitidas: transicionesValidas[presupuestoActual.estado]
        });
        throw new Error(`No se puede cambiar el estado de "${presupuestoActual.estado}" a "${nuevoEstado}"`);
      }
      
      console.log('📝 [NegocioContext] Iniciando cambio de estado en Supabase...');
      const presupuestoActualizado = await cambiarEstadoPresupuestoEnSupabase(presupuestoId, nuevoEstado, fechaVencimiento);
      
      if (!presupuestoActualizado) {
        console.error('❌ [NegocioContext] No se recibieron datos actualizados del servidor');
        throw new Error('No se pudo actualizar el estado del presupuesto en la base de datos');
      }

      console.log('✅ [NegocioContext] Presupuesto estado actualizado en DB:', {
        id: presupuestoActualizado.id,
        estado: presupuestoActualizado.estado,
        nombre: presupuestoActualizado.nombre
      });
      
      // Update local state first
      setNegocios(prevNegocios =>
        prevNegocios.map(negocio =>
          negocio.id === negocioId
            ? {
                ...negocio,
                presupuestos: negocio.presupuestos.map(presupuesto =>
                  presupuesto.id === presupuestoId ? { ...presupuesto, ...presupuestoActualizado } : presupuesto
                )
              }
            : negocio
        )
      );

      // Wait for DB trigger to calculate new business state and sync with HubSpot if needed
      if (estadoAnteriorNegocio) {
        console.log('⏳ [NegocioContext] Esperando trigger de DB para recalcular estado...');
        setTimeout(async () => {
          try {
            console.log('🔄 [NegocioContext] Refreshing business data after state change...');
            
            // Refresh the business data to get the updated state calculated by the trigger
            await refreshNegocios();
            
            // Get the updated business state
            const negocioActualizado = obtenerNegocio(negocioId);
            const estadoNuevoNegocio = negocioActualizado?.estado;
            
            console.log('🔄 [NegocioContext] Estado nuevo negocio después del trigger:', estadoNuevoNegocio);
            
            // If business state changed and has HubSpot ID, sync with HubSpot
            if (estadoAnteriorNegocio && estadoNuevoNegocio && 
                estadoAnteriorNegocio !== estadoNuevoNegocio && 
                negocioActualizado?.hubspot_id) {
              
              console.log('🚀 [NegocioContext] Business state changed, syncing with HubSpot...');
              console.log('🚀 [NegocioContext] Sync params:', { 
                negocioId, 
                estadoAnterior: estadoAnteriorNegocio, 
                estadoNuevo: estadoNuevoNegocio 
              });
              
              await syncDealStage(negocioId, estadoNuevoNegocio);
              console.log('✅ [NegocioContext] HubSpot sync completed after presupuesto change');
            } else {
              console.log('⚠️ [NegocioContext] Skipping HubSpot sync after presupuesto change:', {
                hasEstadoAnterior: !!estadoAnteriorNegocio,
                hasEstadoNuevo: !!estadoNuevoNegocio,
                statesEqual: estadoAnteriorNegocio === estadoNuevoNegocio,
                hasHubSpotId: !!negocioActualizado?.hubspot_id,
                estadoAnteriorNegocio,
                estadoNuevoNegocio
              });
            }
          } catch (syncError) {
            console.error('❌ [NegocioContext] HubSpot sync failed after presupuesto change:', syncError);
          }
        }, 1000); // Wait 1 second for DB trigger to complete
      }
      
      console.log('✅ [NegocioContext] === FIN CAMBIO ESTADO PRESUPUESTO ===');
    } catch (error) {
      console.error("❌ [NegocioContext] === ERROR CAMBIO ESTADO PRESUPUESTO ===");
      console.error("❌ [NegocioContext] Error details:", error);
      console.error("❌ [NegocioContext] Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("❌ [NegocioContext] Parámetros del error:", { negocioId, presupuestoId, nuevoEstado, fechaVencimiento });
      
      // Crear un error más específico para el usuario
      let errorMessage = 'Error al cambiar el estado del presupuesto';
      
      if (error instanceof Error) {
        if (error.message.includes('facturado')) {
          errorMessage = 'No se puede cambiar el estado de un presupuesto ya facturado';
        } else if (error.message.includes('no válida')) {
          errorMessage = error.message;
        } else if (error.message.includes('not found')) {
          errorMessage = 'Presupuesto no encontrado';
        } else if (error.message.includes('policy')) {
          errorMessage = 'No tienes permisos para realizar esta acción';
        }
      }
      
      const customError = new Error(errorMessage);
      console.error("❌ [NegocioContext] Causa original del error:", error);
      throw customError;
    }
  };
  const cambiarEstadoNegocio = async (negocioId: string, nuevoEstado: EstadoNegocio): Promise<void> => {
    try {
      console.log('🔄 [NegocioContext] ==> CAMBIANDO ESTADO DE NEGOCIO <==');
      console.log('🔄 [NegocioContext] Negocio ID:', negocioId);
      console.log('🔄 [NegocioContext] Nuevo estado:', nuevoEstado);
      
      // 1. Obtener estado actual antes de actualizar
      const negocioActual = obtenerNegocio(negocioId);
      const estadoAnterior = negocioActual?.estado;
      const tieneHubSpotId = !!negocioActual?.hubspot_id;
      
      console.log('🔄 [NegocioContext] Estado anterior:', estadoAnterior);
      console.log('🔄 [NegocioContext] Tiene HubSpot ID:', tieneHubSpotId);

      // 2. Actualizar en la base de datos
      console.log('💾 [NegocioContext] Actualizando en base de datos...');
      const negocioActualizado = await cambiarEstadoNegocioEnSupabase(negocioId, nuevoEstado);
      
      if (!negocioActualizado) {
        console.error('❌ [NegocioContext] Failed to update negocio in DB');
        throw new Error('No se pudo actualizar el negocio en la base de datos');
      }

      console.log('✅ [NegocioContext] Negocio actualizado en DB exitosamente');
      
      // 3. Actualizar estado local
      setNegocios(prevNegocios =>
        prevNegocios.map(negocio =>
          negocio.id === negocioId ? negocioActualizado : negocio
        )
      );

      // 4. Sincronizar con HubSpot si es necesario
      if (tieneHubSpotId && estadoAnterior !== nuevoEstado) {
        console.log('🚀 [NegocioContext] Iniciando sincronización con HubSpot...');
        
        try {
          await syncDealStage(negocioId, nuevoEstado);
          console.log('✅ [NegocioContext] Sincronización con HubSpot completada');
        } catch (syncError) {
          console.error('❌ [NegocioContext] Error en sincronización con HubSpot:', syncError);
          // No re-lanzamos el error para que no bloquee la actualización local
        }
      } else {
        console.log('⚠️ [NegocioContext] Saltando sincronización con HubSpot:', {
          tieneHubSpotId,
          estadosCambiaron: estadoAnterior !== nuevoEstado,
          estadoAnterior,
          nuevoEstado
        });
      }

      console.log('🎉 [NegocioContext] Cambio de estado completado exitosamente');

    } catch (error) {
      console.error("❌ [NegocioContext] Error al cambiar estado del negocio:", error);
      throw error;
    }
  };

  const value = {
    negocios,
    loading,
    error,
    obtenerNegocio,
    crearNegocio,
    actualizarNegocio,
    eliminarNegocio,
    crearPresupuesto,
    actualizarPresupuesto,
    eliminarPresupuesto,
    cambiarEstadoPresupuesto,
    cambiarEstadoNegocio,
    refreshNegocios
  };

  return (
    <NegocioContext.Provider value={value}>
      {children}
    </NegocioContext.Provider>
  );
};

const useNegocio = (): NegocioContextProps => {
  const context = useContext(NegocioContext);
  if (context === undefined) {
    throw new Error("useNegocio must be used within a NegocioProvider");
  }
  return context;
};

export { NegocioProvider, useNegocio };
