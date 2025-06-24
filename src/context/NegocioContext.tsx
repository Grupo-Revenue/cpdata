import React, { createContext, useState, useContext, useCallback } from 'react';
import { Negocio, Presupuesto } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface NegocioContextProps {
  negocios: Negocio[];
  loading: boolean;
  error: string | null;
  obtenerNegocio: (id: string) => Negocio | undefined;
  crearNegocio: (negocioData: Omit<Negocio, 'id' | 'created_at' | 'updated_at'>) => Promise<Negocio | null>;
  actualizarNegocio: (id: string, updates: Partial<Negocio>) => Promise<Negocio | null>;
  eliminarNegocio: (id: string) => Promise<boolean>;
  crearPresupuesto: (negocioId: string, presupuestoData: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>) => Promise<Presupuesto | null>;
  actualizarPresupuesto: (negocioId: string, presupuestoId: string, updates: Partial<Presupuesto>) => Promise<Presupuesto | null>;
  eliminarPresupuesto: (negocioId: string, presupuestoId: string) => Promise<boolean>;
  cambiarEstadoPresupuesto: (negocioId: string, presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => Promise<void>;
  cambiarEstadoNegocio: (negocioId: string, nuevoEstado: string) => Promise<void>;
  refreshNegocios: () => Promise<void>;
}

const NegocioContext = createContext<NegocioContextProps | undefined>(undefined);

const obtenerNegociosDesdeSupabase = async (): Promise<Negocio[]> => {
  try {
    const { data, error } = await supabase
      .from('negocios')
      .select(`
        *,
        contacto: contactos (id, nombre, apellido, email, telefono),
        evento: eventos (id, nombreEvento),
        productora: productoras (id, nombre),
        clienteFinal: clientes_finales (id, nombre),
        presupuestos (
          id,
          estado,
          facturado,
          total,
          created_at,
          fecha_envio,
          fecha_aprobacion,
          fecha_rechazo,
          fecha_vencimiento
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching negocios:", error);
      throw error;
    }
    
    return data as Negocio[];
  } catch (error) {
    console.error("Failed to fetch negocios:", error);
    throw error;
  }
};

const NegocioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const obtenerNegocios = useCallback(async () => {
    setLoading(true);
    try {
      const negociosData = await obtenerNegociosDesdeSupabase();
      setNegocios(negociosData);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Error al cargar los negocios");
      setNegocios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    obtenerNegocios();
  }, [obtenerNegocios]);

  // Nueva función para refrescar negocios manualmente
  const refreshNegocios = async () => {
    console.log('[NegocioContext] Manual refresh requested');
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
    return negocios.find(negocio => negocio.id === id);
  };

  const crearNegocio = async (negocioData: Omit<Negocio, 'id' | 'created_at' | 'updated_at'>): Promise<Negocio | null> => {
    try {
      const { data, error } = await supabase
        .from('negocios')
        .insert([negocioData])
        .select(`
          *,
          contacto: contactos (id, nombre, apellido, email, telefono),
          evento: eventos (id, nombreEvento),
          productora: productoras (id, nombre),
          clienteFinal: clientes_finales (id, nombre),
          presupuestos (
            id,
            estado,
            facturado,
            total,
            created_at,
            fecha_envio,
            fecha_aprobacion,
            fecha_rechazo,
            fecha_vencimiento
          )
        `)
        .single();

      if (error) {
        console.error("Error creating negocio:", error);
        throw error;
      }

      setNegocios(prevNegocios => [data as Negocio, ...prevNegocios]);
      return data as Negocio;
    } catch (error) {
      console.error("Failed to create negocio:", error);
      return null;
    }
  };

  const actualizarNegocio = async (id: string, updates: Partial<Negocio>): Promise<Negocio | null> => {
    try {
      const { data, error } = await supabase
        .from('negocios')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          contacto: contactos (id, nombre, apellido, email, telefono),
          evento: eventos (id, nombreEvento),
          productora: productoras (id, nombre),
          clienteFinal: clientes_finales (id, nombre),
          presupuestos (
            id,
            estado,
            facturado,
            total,
            created_at,
            fecha_envio,
            fecha_aprobacion,
            fecha_rechazo,
            fecha_vencimiento
          )
        `)
        .single();

      if (error) {
        console.error("Error updating negocio:", error);
        throw error;
      }

      setNegocios(prevNegocios =>
        prevNegocios.map(negocio => (negocio.id === id ? { ...negocio, ...data } : negocio))
      );
      return data as Negocio;
    } catch (error) {
      console.error("Failed to update negocio:", error);
      return null;
    }
  };

  const eliminarNegocio = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('negocios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting negocio:", error);
        throw error;
      }

      setNegocios(prevNegocios => prevNegocios.filter(negocio => negocio.id !== id));
      return true;
    } catch (error) {
      console.error("Failed to delete negocio:", error);
      return false;
    }
  };

  const crearPresupuesto = async (negocioId: string, presupuestoData: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>): Promise<Presupuesto | null> => {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .insert([{ ...presupuestoData, negocio_id: negocioId }])
        .select('*')
        .single();

      if (error) {
        console.error("Error creating presupuesto:", error);
        throw error;
      }

      // Optimistically update the negocios state
      setNegocios(prevNegocios =>
        prevNegocios.map(negocio =>
          negocio.id === negocioId
            ? { ...negocio, presupuestos: [...(negocio.presupuestos || []), data as Presupuesto] }
            : negocio
        )
      );

      return data as Presupuesto;
    } catch (error) {
      console.error("Failed to create presupuesto:", error);
      return null;
    }
  };

  const actualizarPresupuesto = async (negocioId: string, presupuestoId: string, updates: Partial<Presupuesto>): Promise<Presupuesto | null> => {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .update(updates)
        .eq('id', presupuestoId)
        .select('*')
        .single();

      if (error) {
        console.error("Error updating presupuesto:", error);
        throw error;
      }

      // Optimistically update the negocios state
      setNegocios(prevNegocios =>
        prevNegocios.map(negocio =>
          negocio.id === negocioId
            ? {
                ...negocio,
                presupuestos: negocio.presupuestos.map(presupuesto =>
                  presupuesto.id === presupuestoId ? { ...presupuesto, ...data } : presupuesto
                )
              }
            : negocio
        )
      );

      return data as Presupuesto;
    } catch (error) {
      console.error("Failed to update presupuesto:", error);
      return null;
    }
  };

  const eliminarPresupuesto = async (negocioId: string, presupuestoId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('presupuestos')
        .delete()
        .eq('id', presupuestoId);

      if (error) {
        console.error("Error deleting presupuesto:", error);
        throw error;
      }

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

      return true;
    } catch (error) {
      console.error("Failed to delete presupuesto:", error);
      return false;
    }
  };

  const cambiarEstadoPresupuesto = async (negocioId: string, presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string): Promise<void> => {
    try {
      const updates: { estado: string; fecha_vencimiento?: string } = { estado: nuevoEstado };
      if (fechaVencimiento) {
        updates.fecha_vencimiento = fechaVencimiento;
      }

      const { data, error } = await supabase
        .from('presupuestos')
        .update(updates)
        .eq('id', presupuestoId)
        .select('*')
        .single();

      if (error) {
        console.error("Error updating presupuesto state:", error);
        throw error;
      }

      setNegocios(prevNegocios =>
        prevNegocios.map(negocio =>
          negocio.id === negocioId
            ? {
                ...negocio,
                presupuestos: negocio.presupuestos.map(presupuesto =>
                  presupuesto.id === presupuestoId ? { ...presupuesto, ...data } : presupuesto
                )
              }
            : negocio
        )
      );
    } catch (error) {
      console.error("Failed to update presupuesto state:", error);
    }
  };

  const cambiarEstadoNegocio = async (negocioId: string, nuevoEstado: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('negocios')
        .update({ estado: nuevoEstado })
        .eq('id', negocioId)
        .select(`
          *,
          contacto: contactos (id, nombre, apellido, email, telefono),
          evento: eventos (id, nombreEvento),
          productora: productoras (id, nombre),
          clienteFinal: clientes_finales (id, nombre),
          presupuestos (
            id,
            estado,
            facturado,
            total,
            created_at,
            fecha_envio,
            fecha_aprobacion,
            fecha_rechazo,
            fecha_vencimiento
          )
        `)
        .single();

      if (error) {
        console.error("Error updating negocio state:", error);
        throw error;
      }

      setNegocios(prevNegocios =>
        prevNegocios.map(negocio =>
          negocio.id === negocioId ? { ...negocio, ...data } : negocio
        )
      );
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
    refreshNegocios // Nueva función añadida
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
