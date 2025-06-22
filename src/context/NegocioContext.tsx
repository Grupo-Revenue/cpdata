import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Negocio, Presupuesto, ProductoPresupuesto } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface NegocioContextType {
  negocios: Negocio[];
  contadorNegocio: number;
  loading: boolean;
  crearNegocio: (negocio: Omit<Negocio, 'id' | 'numero' | 'presupuestos' | 'fechaCreacion' | 'estado'>) => Promise<string>;
  obtenerNegocio: (id: string) => Negocio | undefined;
  crearPresupuesto: (negocioId: string, productos: ProductoPresupuesto[]) => Promise<string>;
  actualizarPresupuesto: (negocioId: string, presupuestoId: string, productos: ProductoPresupuesto[]) => Promise<void>;
  eliminarPresupuesto: (negocioId: string, presupuestoId: string) => Promise<void>;
  cambiarEstadoPresupuesto: (negocioId: string, presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => Promise<void>;
  cargarNegocios: () => Promise<void>;
}

const NegocioContext = createContext<NegocioContextType | undefined>(undefined);

export const useNegocio = () => {
  const context = useContext(NegocioContext);
  if (!context) {
    throw new Error('useNegocio debe ser usado dentro de un NegocioProvider');
  }
  return context;
};

interface NegocioProviderProps {
  children: ReactNode;
}

export const NegocioProvider: React.FC<NegocioProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [contadorNegocio, setContadorNegocio] = useState(17658);
  const [loading, setLoading] = useState(false);

  // Cargar negocios desde Supabase
  const cargarNegocios = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: negociosData, error } = await supabase
        .from('negocios')
        .select(`
          *,
          contacto:contactos(*),
          productora:empresas!negocios_productora_id_fkey(*),
          cliente_final:empresas!negocios_cliente_final_id_fkey(*),
          presupuestos(
            *,
            productos:productos_presupuesto(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const negociosFormateados: Negocio[] = negociosData?.map(negocio => ({
        id: negocio.id,
        numero: negocio.numero,
        contacto: {
          id: negocio.contacto.id,
          nombre: negocio.contacto.nombre,
          apellido: negocio.contacto.apellido,
          email: negocio.contacto.email,
          telefono: negocio.contacto.telefono,
          cargo: negocio.contacto.cargo || ''
        },
        productora: negocio.productora ? {
          id: negocio.productora.id,
          nombre: negocio.productora.nombre,
          rut: negocio.productora.rut || '',
          sitioWeb: negocio.productora.sitio_web || '',
          direccion: negocio.productora.direccion || '',
          tipo: 'productora' as const
        } : undefined,
        clienteFinal: negocio.cliente_final ? {
          id: negocio.cliente_final.id,
          nombre: negocio.cliente_final.nombre,
          rut: negocio.cliente_final.rut || '',
          sitioWeb: negocio.cliente_final.sitio_web || '',
          direccion: negocio.cliente_final.direccion || '',
          tipo: 'cliente_final' as const
        } : undefined,
        evento: {
          tipoEvento: negocio.tipo_evento,
          nombreEvento: negocio.nombre_evento,
          fechaEvento: negocio.fecha_evento || '',
          horasAcreditacion: negocio.horas_acreditacion,
          cantidadAsistentes: negocio.cantidad_asistentes || 0,
          cantidadInvitados: negocio.cantidad_invitados || 0,
          locacion: negocio.locacion
        },
        presupuestos: negocio.presupuestos?.map((presupuesto: any) => ({
          id: presupuesto.id,
          nombre: presupuesto.nombre,
          productos: presupuesto.productos?.map((producto: any) => ({
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            comentarios: '', // Add comentarios field for backward compatibility
            cantidad: producto.cantidad,
            precioUnitario: parseFloat(producto.precio_unitario),
            descuentoPorcentaje: 0, // Add descuentoPorcentaje field to fix NaN calculations
            total: parseFloat(producto.total)
          })) || [],
          total: parseFloat(presupuesto.total),
          fechaCreacion: presupuesto.created_at,
          estado: presupuesto.estado as 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'vencido' | 'cancelado',
          fechaVencimiento: presupuesto.fecha_vencimiento || undefined,
          fechaEnvio: presupuesto.fecha_envio || undefined,
          fechaAprobacion: presupuesto.fecha_aprobacion || undefined,
          fechaRechazo: presupuesto.fecha_rechazo || undefined
        })) || [],
        fechaCreacion: negocio.created_at,
        estado: negocio.estado as 'activo' | 'cerrado' | 'cancelado' | 'prospecto' | 'perdido' | 'ganado'
      })) || [];

      setNegocios(negociosFormateados);

      // Cargar contador del usuario
      const { data: contadorData } = await supabase
        .from('contadores_usuario')
        .select('contador_negocio')
        .eq('user_id', user.id)
        .single();

      if (contadorData) {
        setContadorNegocio(contadorData.contador_negocio);
      }
    } catch (error) {
      console.error('Error cargando negocios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los negocios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const crearNegocio = async (negocioData: Omit<Negocio, 'id' | 'numero' | 'presupuestos' | 'fechaCreacion' | 'estado'>): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      // Crear contacto
      const { data: contactoData, error: contactoError } = await supabase
        .from('contactos')
        .insert({
          user_id: user.id,
          nombre: negocioData.contacto.nombre,
          apellido: negocioData.contacto.apellido,
          email: negocioData.contacto.email,
          telefono: negocioData.contacto.telefono,
          cargo: negocioData.contacto.cargo
        })
        .select()
        .single();

      if (contactoError) throw contactoError;

      // Crear productora si existe
      let productoraId = null;
      if (negocioData.productora) {
        const { data: productoraData, error: productoraError } = await supabase
          .from('empresas')
          .insert({
            user_id: user.id,
            nombre: negocioData.productora.nombre,
            rut: negocioData.productora.rut,
            sitio_web: negocioData.productora.sitioWeb,
            direccion: negocioData.productora.direccion,
            tipo: 'productora'
          })
          .select()
          .single();

        if (productoraError) throw productoraError;
        productoraId = productoraData.id;
      }

      // Crear cliente final si existe
      let clienteFinalId = null;
      if (negocioData.clienteFinal) {
        const { data: clienteData, error: clienteError } = await supabase
          .from('empresas')
          .insert({
            user_id: user.id,
            nombre: negocioData.clienteFinal.nombre,
            rut: negocioData.clienteFinal.rut,
            sitio_web: negocioData.clienteFinal.sitioWeb,
            direccion: negocioData.clienteFinal.direccion,
            tipo: 'cliente_final'
          })
          .select()
          .single();

        if (clienteError) throw clienteError;
        clienteFinalId = clienteData.id;
      }

      // Crear negocio
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .insert({
          user_id: user.id,
          numero: contadorNegocio,
          contacto_id: contactoData.id,
          productora_id: productoraId,
          cliente_final_id: clienteFinalId,
          tipo_evento: negocioData.evento.tipoEvento,
          nombre_evento: negocioData.evento.nombreEvento,
          fecha_evento: negocioData.evento.fechaEvento || null,
          horas_acreditacion: negocioData.evento.horasAcreditacion,
          cantidad_asistentes: negocioData.evento.cantidadAsistentes,
          cantidad_invitados: negocioData.evento.cantidadInvitados,
          locacion: negocioData.evento.locacion
        })
        .select()
        .single();

      if (negocioError) throw negocioError;

      // Actualizar contador
      await supabase
        .from('contadores_usuario')
        .upsert({
          user_id: user.id,
          contador_negocio: contadorNegocio + 1
        });

      setContadorNegocio(prev => prev + 1);
      await cargarNegocios();

      return negocio.id;
    } catch (error) {
      console.error('Error creando negocio:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el negocio",
        variant: "destructive"
      });
      throw error;
    }
  };

  const obtenerNegocio = (id: string): Negocio | undefined => {
    return negocios.find(negocio => negocio.id === id);
  };

  const generarNombrePresupuesto = (numero: number, cantidadPresupuestos: number): string => {
    const letra = String.fromCharCode(65 + cantidadPresupuestos);
    return `${numero}${letra}`;
  };

  const crearPresupuesto = async (negocioId: string, productos: ProductoPresupuesto[]): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const negocio = obtenerNegocio(negocioId);
      if (!negocio) throw new Error('Negocio no encontrado');

      const nombrePresupuesto = generarNombrePresupuesto(negocio.numero, negocio.presupuestos.length);
      const total = productos.reduce((sum, producto) => sum + producto.total, 0);

      const { data: presupuesto, error: presupuestoError } = await supabase
        .from('presupuestos')
        .insert({
          negocio_id: negocioId,
          nombre: nombrePresupuesto,
          total: total
        })
        .select()
        .single();

      if (presupuestoError) throw presupuestoError;

      // Crear productos del presupuesto
      if (productos.length > 0) {
        const productosInsert = productos.map(producto => ({
          presupuesto_id: presupuesto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          cantidad: producto.cantidad,
          precio_unitario: producto.precioUnitario,
          total: producto.total
        }));

        const { error: productosError } = await supabase
          .from('productos_presupuesto')
          .insert(productosInsert);

        if (productosError) throw productosError;
      }

      await cargarNegocios();
      return presupuesto.id;
    } catch (error) {
      console.error('Error creando presupuesto:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el presupuesto",
        variant: "destructive"
      });
      throw error;
    }
  };

  const actualizarPresupuesto = async (negocioId: string, presupuestoId: string, productos: ProductoPresupuesto[]): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      // Calcular nuevo total
      const total = productos.reduce((sum, producto) => sum + producto.total, 0);

      // Actualizar el presupuesto con el nuevo total
      const { error: updatePresupuestoError } = await supabase
        .from('presupuestos')
        .update({ total })
        .eq('id', presupuestoId);

      if (updatePresupuestoError) throw updatePresupuestoError;

      // Eliminar productos existentes
      const { error: deleteError } = await supabase
        .from('productos_presupuesto')
        .delete()
        .eq('presupuesto_id', presupuestoId);

      if (deleteError) throw deleteError;

      // Crear nuevos productos
      if (productos.length > 0) {
        const productosInsert = productos.map(producto => ({
          presupuesto_id: presupuestoId,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          cantidad: producto.cantidad,
          precio_unitario: producto.precioUnitario,
          total: producto.total
        }));

        const { error: insertError } = await supabase
          .from('productos_presupuesto')
          .insert(productosInsert);

        if (insertError) throw insertError;
      }

      await cargarNegocios();
    } catch (error) {
      console.error('Error actualizando presupuesto:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el presupuesto",
        variant: "destructive"
      });
      throw error;
    }
  };

  const eliminarPresupuesto = async (negocioId: string, presupuestoId: string): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const { error } = await supabase
        .from('presupuestos')
        .delete()
        .eq('id', presupuestoId);

      if (error) throw error;

      await cargarNegocios();
    } catch (error) {
      console.error('Error eliminando presupuesto:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el presupuesto",
        variant: "destructive"
      });
      throw error;
    }
  };

  const cambiarEstadoPresupuesto = async (negocioId: string, presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const updateData: any = { estado: nuevoEstado };
      
      // Agregar fecha de vencimiento si se está enviando el presupuesto
      if (nuevoEstado === 'enviado' && fechaVencimiento) {
        updateData.fecha_vencimiento = fechaVencimiento;
      }

      const { error } = await supabase
        .from('presupuestos')
        .update(updateData)
        .eq('id', presupuestoId);

      if (error) throw error;

      await cargarNegocios();

      toast({
        title: "Estado actualizado",
        description: `El presupuesto ha sido marcado como ${nuevoEstado}`,
      });
    } catch (error) {
      console.error('Error cambiando estado del presupuesto:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del presupuesto",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Cargar datos cuando el usuario cambie
  useEffect(() => {
    if (user) {
      cargarNegocios();
    } else {
      setNegocios([]);
      setContadorNegocio(17658);
    }
  }, [user]);

  return (
    <NegocioContext.Provider value={{
      negocios,
      contadorNegocio,
      loading,
      crearNegocio,
      obtenerNegocio,
      crearPresupuesto,
      actualizarPresupuesto,
      eliminarPresupuesto,
      cambiarEstadoPresupuesto,
      cargarNegocios
    }}>
      {children}
    </NegocioContext.Provider>
  );
};
