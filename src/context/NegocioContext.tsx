
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Negocio, Presupuesto, EstadoNegocio, EstadoPresupuesto } from '@/types';
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

interface NegocioContextProps {
  negocios: Negocio[];
  loading: boolean;
  error: string | null;
  obtenerNegocio: (id: string) => Negocio | undefined;
  crearNegocio: (negocioData: any) => Promise<Negocio | null>;
  actualizarNegocio: (id: string, updates: Partial<Negocio>) => Promise<Negocio | null>;
  eliminarNegocio: (id: string) => Promise<boolean>;
  crearPresupuesto: (negocioId: string, presupuestoData: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>) => Promise<Presupuesto | null>;
  actualizarPresupuesto: (negocioId: string, presupuestoId: string, updates: Partial<Presupuesto>) => Promise<Presupuesto | null>;
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

  const obtenerNegocios = useCallback(async () => {
    console.log('[NegocioContext] ==> LOADING NEGOCIOS <==');
    setLoading(true);
    try {
      const negociosData = await obtenerNegociosDesdeSupabase();
      console.log('[NegocioContext] Setting negocios state:', {
        count: negociosData.length,
        firstFew: negociosData.slice(0, 3).map(n => ({ id: n.id, numero: n.numero }))
      });
      setNegocios(negociosData);
      setError(null);
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
    obtenerNegocios();
  }, [obtenerNegocios]);

  const refreshNegocios = async () => {
    console.log('[NegocioContext] ==> MANUAL REFRESH REQUESTED <==');
    setLoading(true);
    try {
      await obtenerNegocios();
    } catch (error) {
      console.error('[NegocioContext] Error during manual refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerNegocio = (id: string): Negocio | undefined => {
    console.log('[NegocioContext] ==> SEARCHING FOR NEGOCIO <==');
    console.log('[NegocioContext] Searching for ID:', id);
    console.log('[NegocioContext] ID type:', typeof id);
    console.log('[NegocioContext] Available negocios:', negocios.length);
    
    // Log all available IDs for debugging
    console.log('[NegocioContext] All available IDs:');
    negocios.forEach((negocio, index) => {
      console.log(`[NegocioContext] - ${index}: ${negocio.id} (${typeof negocio.id})`);
    });
    
    const found = negocios.find(negocio => {
      const match = negocio.id === id;
      console.log(`[NegocioContext] Comparing ${negocio.id} === ${id}: ${match}`);
      return match;
    });
    
    console.log('[NegocioContext] Search result:', {
      found: !!found,
      foundId: found?.id,
      foundNumero: found?.numero
    });
    
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

  const actualizarPresupuesto = async (negocioId: string, presupuestoId: string, updates: Partial<Presupuesto>): Promise<Presupuesto | null> => {
    const presupuestoActualizado = await actualizarPresupuestoEnSupabase(presupuestoId, updates);
    if (presupuestoActualizado) {
      // Optimistically update the negocios state
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
    }
    return presupuestoActualizado;
  };

  const eliminarPresupuesto = async (negocioId: string, presupuestoId: string): Promise<boolean> => {
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
    }
    return eliminado;
  };

  const cambiarEstadoPresupuesto = async (negocioId: string, presupuestoId: string, nuevoEstado: EstadoPresupuesto, fechaVencimiento?: string): Promise<void> => {
    try {
      const presupuestoActualizado = await cambiarEstadoPresupuestoEnSupabase(presupuestoId, nuevoEstado, fechaVencimiento);
      if (presupuestoActualizado) {
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
      }
    } catch (error) {
      console.error("Failed to update presupuesto state:", error);
    }
  };

  const cambiarEstadoNegocio = async (negocioId: string, nuevoEstado: EstadoNegocio): Promise<void> => {
    try {
      const negocioActualizado = await cambiarEstadoNegocioEnSupabase(negocioId, nuevoEstado);
      if (negocioActualizado) {
        setNegocios(prevNegocios =>
          prevNegocios.map(negocio =>
            negocio.id === negocioId ? negocioActualizado : negocio
          )
        );
      }
    } catch (error) {
      console.error("Failed to update negocio state:", error);
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
