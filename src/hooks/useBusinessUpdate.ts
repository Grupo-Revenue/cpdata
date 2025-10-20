import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Contacto, Empresa, TipoEmpresa } from '@/types';
import { useHubSpotContactValidation } from '@/hooks/useHubSpotContactValidation';

export const useBusinessUpdate = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const {
    searchContactInHubSpot,
    createContactInHubSpot,
    updateContactInHubSpot
  } = useHubSpotContactValidation();

  const updateContact = async (negocioId: string, contactData: Partial<Contacto>) => {
    setIsUpdating(true);
    try {
      console.log('[useBusinessUpdate] Updating contact for negocio:', negocioId);
      
      // Get the current business to find the contact_id
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .select('contacto_id')
        .eq('id', negocioId)
        .single();

      if (negocioError) throw negocioError;
      if (!negocio) throw new Error('Negocio no encontrado');

      // Update the contact
      const { data: updatedContact, error: contactError } = await supabase
        .from('contactos')
        .update({
          nombre: contactData.nombre,
          apellido: contactData.apellido,
          email: contactData.email,
          telefono: contactData.telefono,
          cargo: contactData.cargo,
          updated_at: new Date().toISOString()
        })
        .eq('id', negocio.contacto_id)
        .select()
        .single();

      if (contactError) throw contactError;

      console.log('[useBusinessUpdate] Contact updated successfully:', updatedContact);

      // Sincronizar con HubSpot
      try {
        console.log('[useBusinessUpdate] Syncing contact with HubSpot...');
        
        // Buscar el contacto en HubSpot por email
        const hubspotResult = await searchContactInHubSpot(updatedContact.email);
        
        if (hubspotResult?.found && hubspotResult.contact) {
          // Contacto existe en HubSpot, actualizarlo
          console.log('[useBusinessUpdate] Updating existing HubSpot contact:', hubspotResult.contact.hubspotId);
          await updateContactInHubSpot({
            hubspotId: hubspotResult.contact.hubspotId,
            email: updatedContact.email,
            nombre: updatedContact.nombre,
            apellido: updatedContact.apellido,
            telefono: updatedContact.telefono,
            cargo: updatedContact.cargo || ''
          });
          
          // Si no tenía hubspot_id guardado, guardarlo
          if (!updatedContact.hubspot_id) {
            await supabase
              .from('contactos')
              .update({ hubspot_id: hubspotResult.contact.hubspotId })
              .eq('id', updatedContact.id);
          }
          
          console.log('[useBusinessUpdate] HubSpot contact updated successfully');
        } else {
          // Contacto no existe en HubSpot, crearlo
          console.log('[useBusinessUpdate] Creating new HubSpot contact');
          const createResult = await createContactInHubSpot({
            email: updatedContact.email,
            nombre: updatedContact.nombre,
            apellido: updatedContact.apellido,
            telefono: updatedContact.telefono,
            cargo: updatedContact.cargo || ''
          });
          
          if (createResult.success && createResult.hubspotId) {
            // Guardar el hubspot_id en Supabase
            await supabase
              .from('contactos')
              .update({ hubspot_id: createResult.hubspotId })
              .eq('id', updatedContact.id);
            
            console.log('[useBusinessUpdate] HubSpot contact created successfully:', createResult.hubspotId);
          }
        }
        
        toast({
          title: "Contacto actualizado",
          description: "Información sincronizada con HubSpot correctamente"
        });
      } catch (hubspotError) {
        console.error('[useBusinessUpdate] Error syncing with HubSpot:', hubspotError);
        toast({
          title: "Contacto actualizado localmente",
          description: "No se pudo sincronizar con HubSpot",
          variant: "destructive"
        });
      }

      return updatedContact;
    } catch (error) {
      console.error('[useBusinessUpdate] Error updating contact:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el contacto",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateCompanies = async (
    negocioId: string,
    productoraData?: Partial<Empresa> & { tipo: TipoEmpresa },
    clienteFinalData?: Partial<Empresa> & { tipo: TipoEmpresa }
  ) => {
    setIsUpdating(true);
    try {
      console.log('[useBusinessUpdate] Updating companies for negocio:', negocioId);

      // Get the current business to find company IDs
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .select('productora_id, cliente_final_id')
        .eq('id', negocioId)
        .single();

      if (negocioError) throw negocioError;
      if (!negocio) throw new Error('Negocio no encontrado');

      const results: { productora?: Empresa; clienteFinal?: Empresa } = {};

      // Update productora if data provided
      if (productoraData && negocio.productora_id) {
        const { data: updatedProductora, error: productoraError } = await supabase
          .from('empresas')
          .update({
            nombre: productoraData.nombre,
            rut: productoraData.rut,
            sitio_web: productoraData.sitio_web,
            direccion: productoraData.direccion,
            tipo: productoraData.tipo,
            updated_at: new Date().toISOString()
          })
          .eq('id', negocio.productora_id)
          .select()
          .single();

        if (productoraError) throw productoraError;
        results.productora = updatedProductora;
      }

      // Update cliente final if data provided
      if (clienteFinalData && negocio.cliente_final_id) {
        const { data: updatedClienteFinal, error: clienteFinalError } = await supabase
          .from('empresas')
          .update({
            nombre: clienteFinalData.nombre,
            rut: clienteFinalData.rut,
            sitio_web: clienteFinalData.sitio_web,
            direccion: clienteFinalData.direccion,
            tipo: clienteFinalData.tipo,
            updated_at: new Date().toISOString()
          })
          .eq('id', negocio.cliente_final_id)
          .select()
          .single();

        if (clienteFinalError) throw clienteFinalError;
        results.clienteFinal = updatedClienteFinal;
      }

      console.log('[useBusinessUpdate] Companies updated successfully:', results);
      toast({
        title: "Empresas actualizadas",
        description: "La información de las empresas se actualizó correctamente"
      });

      return results;
    } catch (error) {
      console.error('[useBusinessUpdate] Error updating companies:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar las empresas",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateEvent = async (
    negocioId: string,
    eventData: {
      tipo_evento?: string;
      nombre_evento?: string;
      fecha_evento?: string;
      cantidad_asistentes?: number;
      cantidad_invitados?: number;
      locacion?: string;
      horas_acreditacion?: string;
      fecha_cierre?: string;
    }
  ) => {
    setIsUpdating(true);
    try {
      console.log('[useBusinessUpdate] Updating event for negocio:', negocioId);

      const { data: updatedNegocio, error: negocioError } = await supabase
        .from('negocios')
        .update({
          tipo_evento: eventData.tipo_evento,
          nombre_evento: eventData.nombre_evento,
          fecha_evento: eventData.fecha_evento,
          cantidad_asistentes: eventData.cantidad_asistentes,
          cantidad_invitados: eventData.cantidad_invitados,
          locacion: eventData.locacion,
          horas_acreditacion: eventData.horas_acreditacion,
          fecha_cierre: eventData.fecha_cierre,
          updated_at: new Date().toISOString()
        })
        .eq('id', negocioId)
        .select()
        .single();

      if (negocioError) throw negocioError;

      console.log('[useBusinessUpdate] Event updated successfully:', updatedNegocio);
      toast({
        title: "Evento actualizado",
        description: "La información del evento se actualizó correctamente"
      });

      return updatedNegocio;
    } catch (error) {
      console.error('[useBusinessUpdate] Error updating event:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el evento",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    updateContact,
    updateCompanies,
    updateEvent
  };
};
