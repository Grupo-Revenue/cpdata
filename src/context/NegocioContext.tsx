import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Negocio, Presupuesto, ProductoPresupuesto } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { calcularValorNegocio, mapLegacyBusinessState } from '@/utils/businessCalculations';

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
  cambiarEstadoNegocio: (negocioId: string, nuevoEstado: string) => Promise<void>;
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
  const { syncNegocio } = useHubSpotConfig();
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

      const negociosFormateados: Negocio[] = negociosData?.map(negocio => {
        // Apply state normalization to ensure legacy states are mapped to new states
        const estadoNormalizado = mapLegacyBusinessState(negocio.estado);
        
        return {
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
              comentarios: '',
              cantidad: producto.cantidad,
              precioUnitario: parseFloat(producto.precio_unitario),
              descuentoPorcentaje: 0,
              total: parseFloat(producto.total)
            })) || [],
            total: parseFloat(presupuesto.total),
            fechaCreacion: presupuesto.created_at,
            estado: presupuesto.estado as 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'vencido' | 'cancelado',
            fechaVencimiento: presupuesto.fecha_vencimiento || undefined,
            fechaEnvio: presupuesto.fecha_envio || undefined,
            fechaAprobacion: presupuesto.fecha_aprobacion || undefined,
            fechaRechazo: presupuesto.fecha_rechazo || undefined,
            fechaFacturacion: presupuesto.fecha_facturacion || undefined,
            facturado: presupuesto.facturado || false
          })) || [],
          fechaCreacion: negocio.created_at,
          estado: estadoNormalizado as Negocio['estado'] // Use the normalized state
        };
      }) || [];

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

  const findOrCreateEmpresa = async (empresaData: any, tipo: 'productora' | 'cliente_final') => {
    if (!empresaData || !empresaData.nombre || empresaData.nombre.trim() === '') {
      console.log(`No ${tipo} data provided or empty name, skipping creation`);
      return null;
    }

    const nombreLimpio = empresaData.nombre.trim();
    console.log(`Processing ${tipo}: "${nombreLimpio}"`);

    try {
      // First, try to find existing company with exact name match
      console.log(`Searching for existing ${tipo} with name: "${nombreLimpio}"`);
      const { data: existingEmpresas, error: searchError } = await supabase
        .from('empresas')
        .select('id, nombre')
        .eq('user_id', user!.id)
        .eq('tipo', tipo)
        .ilike('nombre', nombreLimpio);

      if (searchError) {
        console.error(`Error searching for existing ${tipo}:`, searchError);
        throw new Error(`Error al buscar ${tipo} existente: ${searchError.message}`);
      }

      console.log(`Found ${existingEmpresas?.length || 0} existing ${tipo}(s) matching "${nombreLimpio}"`);

      // If exact match found, return the first one
      if (existingEmpresas && existingEmpresas.length > 0) {
        console.log(`Using existing ${tipo}:`, existingEmpresas[0].id);
        return existingEmpresas[0].id;
      }

      // If no existing company found, create new one
      console.log(`Creating new ${tipo}: "${nombreLimpio}"`);
      const empresaToInsert = {
        user_id: user!.id,
        nombre: nombreLimpio,
        rut: empresaData.rut?.trim() || null,
        sitio_web: empresaData.sitioWeb?.trim() || null,
        direccion: empresaData.direccion?.trim() || null,
        tipo: tipo
      };

      console.log(`Inserting ${tipo} data:`, empresaToInsert);

      const { data: nuevaEmpresa, error: createError } = await supabase
        .from('empresas')
        .insert(empresaToInsert)
        .select()
        .single();

      if (createError) {
        console.error(`Error creating ${tipo}:`, createError);
        
        // Handle specific unique constraint violations
        if (createError.code === '23505') {
          console.log(`Unique constraint error for ${tipo}, attempting to find existing record again`);
          
          // Try to find the existing record again (race condition handling)
          const { data: retryEmpresas, error: retryError } = await supabase
            .from('empresas')
            .select('id, nombre')
            .eq('user_id', user!.id)
            .eq('tipo', tipo)
            .ilike('nombre', nombreLimpio)
            .limit(1);

          if (!retryError && retryEmpresas && retryEmpresas.length > 0) {
            console.log(`Found existing ${tipo} on retry:`, retryEmpresas[0].id);
            return retryEmpresas[0].id;
          }

          // If still can't find, try with a unique suffix as fallback
          const timestamp = Date.now();
          const fallbackName = `${nombreLimpio} (${timestamp})`;
          console.log(`Attempting fallback creation with name: "${fallbackName}"`);

          const fallbackEmpresa = {
            ...empresaToInsert,
            nombre: fallbackName
          };

          const { data: fallbackResult, error: fallbackError } = await supabase
            .from('empresas')
            .insert(fallbackEmpresa)
            .select()
            .single();

          if (fallbackError) {
            console.error(`Fallback creation failed for ${tipo}:`, fallbackError);
            throw new Error(`No se pudo crear ${tipo}: ${fallbackError.message}`);
          }

          console.log(`Fallback ${tipo} created successfully:`, fallbackResult.id);
          return fallbackResult.id;
        }

        throw new Error(`Error al crear ${tipo}: ${createError.message}`);
      }

      console.log(`New ${tipo} created successfully:`, nuevaEmpresa.id);
      return nuevaEmpresa.id;
    } catch (error) {
      console.error(`Critical error in findOrCreateEmpresa for ${tipo}:`, error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`Error inesperado al procesar ${tipo}`);
    }
  };

  const crearNegocio = async (negocioData: Omit<Negocio, 'id' | 'numero' | 'presupuestos' | 'fechaCreacion' | 'estado'>): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      console.log('=== Starting business creation process ===');
      console.log('Business data received:', {
        contacto: negocioData.contacto,
        productora: negocioData.productora?.nombre || 'None',
        clienteFinal: negocioData.clienteFinal?.nombre || 'None',
        evento: negocioData.evento
      });
      
      // Validate required fields before proceeding
      if (!negocioData.contacto?.nombre || !negocioData.contacto?.apellido || 
          !negocioData.contacto?.email || !negocioData.contacto?.telefono) {
        throw new Error('Información de contacto incompleta');
      }

      if (!negocioData.evento?.tipoEvento || !negocioData.evento?.nombreEvento || 
          !negocioData.evento?.horasAcreditacion || !negocioData.evento?.locacion) {
        throw new Error('Información del evento incompleta');
      }

      // Create contact
      console.log('Creating contact...');
      const { data: contactoData, error: contactoError } = await supabase
        .from('contactos')
        .insert({
          user_id: user.id,
          nombre: negocioData.contacto.nombre.trim(),
          apellido: negocioData.contacto.apellido.trim(),
          email: negocioData.contacto.email.trim(),
          telefono: negocioData.contacto.telefono.trim(),
          cargo: negocioData.contacto.cargo?.trim() || null
        })
        .select()
        .single();

      if (contactoError) {
        console.error('Error creating contact:', contactoError);
        
        // Handle duplicate contact error
        if (contactoError.code === '23505' && contactoError.message.includes('contactos_user_id_email_key')) {
          throw new Error('Ya existe un contacto con este email. Use un email diferente.');
        }
        
        throw new Error(`Error al crear contacto: ${contactoError.message}`);
      }

      console.log('Contact created successfully:', contactoData.id);

      // Handle productora (find or create)
      let productoraId = null;
      if (negocioData.productora) {
        console.log('Processing productora...');
        productoraId = await findOrCreateEmpresa(negocioData.productora, 'productora');
        console.log('Productora processed, ID:', productoraId);
      }

      // Handle cliente final (find or create)
      let clienteFinalId = null;
      if (negocioData.clienteFinal) {
        console.log('Processing cliente final...');
        clienteFinalId = await findOrCreateEmpresa(negocioData.clienteFinal, 'cliente_final');
        console.log('Cliente final processed, ID:', clienteFinalId);
      }

      // Create business with new state 'oportunidad_creada'
      console.log('Creating business...');
      const negocioToInsert = {
        user_id: user.id,
        numero: contadorNegocio,
        contacto_id: contactoData.id,
        productora_id: productoraId,
        cliente_final_id: clienteFinalId,
        tipo_evento: negocioData.evento.tipoEvento,
        nombre_evento: negocioData.evento.nombreEvento.trim(),
        fecha_evento: negocioData.evento.fechaEvento || null,
        horas_acreditacion: negocioData.evento.horasAcreditacion.trim(),
        cantidad_asistentes: negocioData.evento.cantidadAsistentes || 0,
        cantidad_invitados: negocioData.evento.cantidadInvitados || 0,
        locacion: negocioData.evento.locacion.trim(),
        estado: 'oportunidad_creada' as const
      };

      console.log('Inserting business data:', negocioToInsert);

      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .insert(negocioToInsert)
        .select()
        .single();

      if (negocioError) {
        console.error('Error creating business:', negocioError);
        throw new Error(`Error al crear negocio: ${negocioError.message}`);
      }

      console.log('Business created successfully:', negocio.id);

      // Update counter
      console.log('Updating business counter...');
      const { error: counterError } = await supabase
        .from('contadores_usuario')
        .upsert({
          user_id: user.id,
          contador_negocio: contadorNegocio + 1
        });

      if (counterError) {
        console.warn('Error updating counter (non-critical):', counterError);
      }

      setContadorNegocio(prev => prev + 1);
      
      // Reload businesses FIRST, then sync with HubSpot
      console.log('Reloading businesses...');
      await cargarNegocios();

      // Sync with HubSpot AFTER reloading businesses
      console.log('Syncing with HubSpot...');
      try {
        // Now that cargarNegocios has completed, obtenerNegocio should find the business
        const negocioCompleto = obtenerNegocio(negocio.id);
        
        if (negocioCompleto) {
          console.log('Found complete business for HubSpot sync:', negocioCompleto.id);
          const valorTotal = calcularValorNegocio(negocioCompleto);
          const hubspotData = {
            id: negocio.id,
            numero: negocio.numero,
            contacto: negocioData.contacto,
            evento: negocioData.evento,
            valorTotal: valorTotal
          };
          
          const syncResult = await syncNegocio(hubspotData, 'create');
          if (syncResult.success && !syncResult.skipped) {
            console.log('Business synced with HubSpot successfully');
          } else if (syncResult.skipped) {
            console.log('HubSpot sync skipped (not configured or disabled)');
          }
        } else {
          // Fallback: construct hubspotData from available data
          console.log('Business not found in local state, using fallback data for HubSpot sync');
          const hubspotData = {
            id: negocio.id,
            numero: negocio.numero,
            contacto: negocioData.contacto,
            evento: negocioData.evento,
            valorTotal: 0 // No budget yet, so value is 0
          };
          
          const syncResult = await syncNegocio(hubspotData, 'create');
          if (syncResult.success && !syncResult.skipped) {
            console.log('Business synced with HubSpot successfully (fallback data)');
          }
        }
      } catch (syncError) {
        console.warn('HubSpot sync failed (non-critical):', syncError);
        // Don't throw error here as the business was created successfully
      }

      console.log('=== Business creation completed successfully ===');
      return negocio.id;
    } catch (error) {
      console.error('=== Business creation failed ===');
      console.error('Error details:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes('contactos_user_id_email_key')) {
          toast({
            title: "Email duplicado",
            description: "Ya existe un contacto con este email. Use un email diferente.",
            variant: "destructive"
          });
        } else if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
          toast({
            title: "Información duplicada",
            description: "Ya existe información similar. Verifique los datos e intente nuevamente.",
            variant: "destructive"
          });
        } else if (errorMessage.includes('incompleta')) {
          toast({
            title: "Información incompleta",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: `Error al crear el negocio: ${errorMessage}`,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el negocio. Verifique los datos e intente nuevamente.",
          variant: "destructive"
        });
      }
      
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
      
      // Reload businesses FIRST, then sync with HubSpot
      await cargarNegocios();
      
      // Sync updated business value with HubSpot AFTER reloading
      try {
        const negocioActualizado = obtenerNegocio(negocioId);
        if (negocioActualizado) {
          const valorTotal = calcularValorNegocio(negocioActualizado);
          const hubspotData = {
            id: negocioActualizado.id,
            numero: negocioActualizado.numero,
            contacto: negocioActualizado.contacto,
            evento: negocioActualizado.evento,
            valorTotal: valorTotal
          };
          
          await syncNegocio(hubspotData, 'update');
        }
      } catch (syncError) {
        console.warn('HubSpot sync failed (non-critical):', syncError);
      }
      
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
      
      // Reload businesses FIRST, then sync with HubSpot
      await cargarNegocios();
      
      // Sync updated business value with HubSpot AFTER reloading
      try {
        const negocioActualizado = obtenerNegocio(negocioId);
        if (negocioActualizado) {
          const valorTotal = calcularValorNegocio(negocioActualizado);
          const hubspotData = {
            id: negocioActualizado.id,
            numero: negocioActualizado.numero,
            contacto: negocioActualizado.contacto,
            evento: negocioActualizado.evento,
            valorTotal: valorTotal
          };
          
          await syncNegocio(hubspotData, 'update');
        }
      } catch (syncError) {
        console.warn('HubSpot sync failed (non-critical):', syncError);
      }
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

  const cambiarEstadoNegocio = async (negocioId: string, nuevoEstado: string): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');
    
    try {
      const { error } = await supabase
        .from('negocios')
        .update({ estado: nuevoEstado as Negocio['estado'] })
        .eq('id', negocioId);
      
      if (error) throw error;
      
      // Reload businesses FIRST, then sync with HubSpot
      await cargarNegocios();
      
      // Sync updated business state with HubSpot AFTER reloading
      try {
        const negocioActualizado = obtenerNegocio(negocioId);
        if (negocioActualizado) {
          const valorTotal = calcularValorNegocio(negocioActualizado);
          const hubspotData = {
            id: negocioActualizado.id,
            numero: negocioActualizado.numero,
            contacto: negocioActualizado.contacto,
            evento: negocioActualizado.evento,
            valorTotal: valorTotal
          };
          
          await syncNegocio(hubspotData, 'update');
        }
      } catch (syncError) {
        console.warn('HubSpot sync failed (non-critical):', syncError);
      }
      
      toast({
        title: "Estado actualizado",
        description: "El estado del negocio ha sido actualizado correctamente",
      });
    } catch (error) {
      console.error('Error cambiando estado del negocio:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del negocio",
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
      cambiarEstadoNegocio,
      cargarNegocios
    }}>
      {children}
    </NegocioContext.Provider>
  );
};
