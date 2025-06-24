import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Negocio, Presupuesto, EstadoNegocio, EstadoPresupuesto } from '@/types';
import { supabase } from '@/integrations/supabase/client';

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

const obtenerNegociosDesdeSupabase = async (): Promise<Negocio[]> => {
  try {
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
      console.error("Error fetching negocios:", error);
      throw error;
    }
    
    // Transform the data to match ExtendedNegocio type
    const transformedData = data.map(negocio => ({
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
    }));
    
    return transformedData as Negocio[];
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

  const crearNegocio = async (negocioData: any): Promise<Negocio | null> => {
    try {
      // First create contact if provided
      let contactoId = null;
      if (negocioData.contacto) {
        const { data: contactoData, error: contactoError } = await supabase
          .from('contactos')
          .insert([{
            ...negocioData.contacto,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }])
          .select('id')
          .single();

        if (contactoError) throw contactoError;
        contactoId = contactoData.id;
      }

      // Create productora if provided
      let productoraId = null;
      if (negocioData.productora) {
        const { data: productoraData, error: productoraError } = await supabase
          .from('empresas')
          .insert([{
            ...negocioData.productora,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }])
          .select('id')
          .single();

        if (productoraError) throw productoraError;
        productoraId = productoraData.id;
      }

      // Create cliente final if provided
      let clienteFinalId = null;
      if (negocioData.clienteFinal) {
        const { data: clienteData, error: clienteError } = await supabase
          .from('empresas')
          .insert([{
            ...negocioData.clienteFinal,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }])
          .select('id')
          .single();

        if (clienteError) throw clienteError;
        clienteFinalId = clienteData.id;
      }

      // Get next business number
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: counterData, error: counterError } = await supabase
        .from('contadores_usuario')
        .select('contador_negocio')
        .eq('user_id', userId)
        .single();

      if (counterError) throw counterError;

      // Create the negocio
      const { data, error } = await supabase
        .from('negocios')
        .insert([{
          user_id: userId,
          numero: counterData.contador_negocio,
          contacto_id: contactoId,
          productora_id: productoraId,
          cliente_final_id: clienteFinalId,
          tipo_evento: negocioData.tipo_evento,
          nombre_evento: negocioData.nombre_evento,
          fecha_evento: negocioData.fecha_evento,
          horas_acreditacion: negocioData.horas_acreditacion,
          cantidad_asistentes: negocioData.cantidad_asistentes || 0,
          cantidad_invitados: negocioData.cantidad_invitados || 0,
          locacion: negocioData.locacion,
          fecha_cierre: negocioData.fecha_cierre,
          estado: 'oportunidad_creada'
        }])
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
        .single();

      if (error) {
        console.error("Error creating negocio:", error);
        throw error;
      }

      // Update counter
      await supabase
        .from('contadores_usuario')
        .update({ contador_negocio: counterData.contador_negocio + 1 })
        .eq('user_id', userId);

      // Transform the data to match ExtendedNegocio type
      const transformedNegocio = {
        ...data,
        evento: {
          tipoEvento: data.tipo_evento,
          nombreEvento: data.nombre_evento,
          fechaEvento: data.fecha_evento,
          horasAcreditacion: data.horas_acreditacion,
          cantidadAsistentes: data.cantidad_asistentes,
          cantidadInvitados: data.cantidad_invitados,
          locacion: data.locacion
        },
        fechaCreacion: data.created_at,
        fechaCierre: data.fecha_cierre,
        presupuestos: data.presupuestos?.map(p => ({
          ...p,
          fechaCreacion: p.created_at,
          fechaEnvio: p.fecha_envio,
          fechaAprobacion: p.fecha_aprobacion,
          fechaRechazo: p.fecha_rechazo,
          fechaVencimiento: p.fecha_vencimiento
        })) || []
      };

      setNegocios(prevNegocios => [transformedNegocio as Negocio, ...prevNegocios]);
      return transformedNegocio as Negocio;
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
        .single();

      if (error) {
        console.error("Error updating negocio:", error);
        throw error;
      }

      // Transform the data
      const transformedNegocio = {
        ...data,
        evento: {
          tipoEvento: data.tipo_evento,
          nombreEvento: data.nombre_evento,
          fechaEvento: data.fecha_evento,
          horasAcreditacion: data.horas_acreditacion,
          cantidadAsistentes: data.cantidad_asistentes || 0,
          cantidadInvitados: data.cantidad_invitados || 0,
          locacion: data.locacion
        },
        fechaCreacion: data.created_at,
        fechaCierre: data.fecha_cierre,
        presupuestos: data.presupuestos?.map(p => ({
          ...p,
          fechaCreacion: p.created_at,
          fechaEnvio: p.fecha_envio,
          fechaAprobacion: p.fecha_aprobacion,
          fechaRechazo: p.fecha_rechazo,
          fechaVencimiento: p.fecha_vencimiento
        })) || []
      };

      setNegocios(prevNegocios =>
        prevNegocios.map(negocio => (negocio.id === id ? transformedNegocio as Negocio : negocio))
      );
      return transformedNegocio as Negocio;
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

  const cambiarEstadoPresupuesto = async (negocioId: string, presupuestoId: string, nuevoEstado: EstadoPresupuesto, fechaVencimiento?: string): Promise<void> => {
    try {
      const updates: { estado: EstadoPresupuesto; fecha_vencimiento?: string } = { estado: nuevoEstado };
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

  const cambiarEstadoNegocio = async (negocioId: string, nuevoEstado: EstadoNegocio): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('negocios')
        .update({ estado: nuevoEstado })
        .eq('id', negocioId)
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
        .single();

      if (error) {
        console.error("Error updating negocio state:", error);
        throw error;
      }

      // Transform the data properly to match ExtendedNegocio
      const transformedNegocio = {
        ...data,
        evento: {
          tipoEvento: data.tipo_evento,
          nombreEvento: data.nombre_evento,
          fechaEvento: data.fecha_evento,
          horasAcreditacion: data.horas_acreditacion,
          cantidadAsistentes: data.cantidad_asistentes || 0,
          cantidadInvitados: data.cantidad_invitados || 0,
          locacion: data.locacion
        },
        fechaCreacion: data.created_at,
        fechaCierre: data.fecha_cierre,
        presupuestos: data.presupuestos?.map(p => ({
          ...p,
          fechaCreacion: p.created_at,
          fechaEnvio: p.fecha_envio,
          fechaAprobacion: p.fecha_aprobacion,
          fechaRechazo: p.fecha_rechazo,
          fechaVencimiento: p.fecha_vencimiento
        })) || []
      };

      setNegocios(prevNegocios =>
        prevNegocios.map(negocio =>
          negocio.id === negocioId ? transformedNegocio as Negocio : negocio
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
