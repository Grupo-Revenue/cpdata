import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useHubSpotConnectionStatus } from './useHubSpotConnectionStatus';

interface ContactData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo?: string;
  hubspotId?: string;
}

interface HubSpotContact {
  hubspotId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  jobtitle?: string;
}

interface ValidationResult {
  found: boolean;
  contact?: HubSpotContact;
  message?: string;
}

interface CreateUpdateResult {
  success: boolean;
  contact?: HubSpotContact;
  created?: boolean;
  updated?: boolean;
  message?: string;
  error?: string;
  hubspotId?: string;
}

export const useHubSpotContactValidation = () => {
  const { isConnected } = useHubSpotConnectionStatus();
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isContactFound, setIsContactFound] = useState<boolean | null>(null);

  const searchContactInHubSpot = async (email: string): Promise<ValidationResult | null> => {
    if (!email || !email.includes('@')) {
      setValidationMessage(null);
      setIsContactFound(null);
      return null;
    }

    if (!isConnected) {
      console.log('[HubSpot Contact] Not connected, showing error message');
      setValidationMessage('No está conectado a HubSpot. Por favor, configure la conexión en Configuración.');
      setIsContactFound(null);
      toast({
        title: "Sin conexión a HubSpot",
        description: "Configure la conexión a HubSpot en la sección de Configuración.",
        variant: "destructive"
      });
      return null;
    }

    setIsValidating(true);
    setValidationMessage(null);
    setIsContactFound(null);

    try {
      console.log('[HubSpot Contact] Invoking search function for email:', email.trim().toLowerCase());
      
      const { data, error } = await supabase.functions.invoke('hubspot-contact-validation', {
        body: {
          action: 'search',
          email: email.trim().toLowerCase()
        }
      });

      console.log('[HubSpot Contact] Function response:', { data, error });

      if (error) {
        console.error('[HubSpot Contact] Function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        console.error('[HubSpot Contact] Function returned error:', data?.error);
        throw new Error(data?.error || 'Error al buscar el contacto');
      }

      if (data.found) {
        setValidationMessage('El contacto fue encontrado en HubSpot y sus datos han sido completados automáticamente.');
        setIsContactFound(true);
        toast({
          title: "Contacto encontrado",
          description: "Los datos del contacto han sido completados automáticamente desde HubSpot.",
        });
      } else {
        setValidationMessage('El contacto no existe en HubSpot. Se creará uno nuevo al finalizar.');
        setIsContactFound(false);
        toast({
          title: "Contacto no encontrado",
          description: "Se creará un nuevo contacto en HubSpot al finalizar el proceso.",
          variant: "default"
        });
      }

      return data;

    } catch (error) {
      console.error('Error searching contact:', error);
      
      // More specific error handling
      const errorMessage = error?.value?.message || error?.message || 'Error desconocido';
      
      if (errorMessage.includes('Edge Function returned a non-2xx status code')) {
        setValidationMessage('Error de configuración en HubSpot. Verifique que la clave de API sea válida y tenga los permisos correctos.');
        toast({
          title: "Error de configuración",
          description: "La clave de API de HubSpot no es válida o no tiene los permisos necesarios. Verifique la configuración.",
          variant: "destructive"
        });
      } else {
        setValidationMessage('No se pudo buscar el contacto en HubSpot. Verifique su conexión.');
        toast({
          title: "Error de búsqueda",
          description: "No se pudo buscar el contacto en HubSpot. Verifique su conexión.",
          variant: "destructive"
        });
      }
      
      setIsContactFound(null);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const createContactInHubSpot = async (contactData: ContactData): Promise<CreateUpdateResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-contact-validation', {
        body: {
          action: 'create',
          contactData: {
            ...contactData,
            email: contactData.email.toLowerCase()
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error al crear el contacto');
      }

      toast({
        title: "Contacto creado",
        description: "El contacto ha sido creado exitosamente en HubSpot.",
      });

      return {
        success: true,
        created: true,
        contact: data.contact,
        message: data.message,
        hubspotId: data.contact?.hubspotId
      };

    } catch (error) {
      console.error('Error creating contact in HubSpot:', error);
      
      return {
        success: false,
        error: error.message || 'Error al crear el contacto en HubSpot'
      };
    }
  };

  const updateContactInHubSpot = async (contactData: ContactData): Promise<CreateUpdateResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-contact-validation', {
        body: {
          action: 'update',
          contactData: {
            ...contactData,
            email: contactData.email.toLowerCase()
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error al actualizar el contacto');
      }

      toast({
        title: "Contacto actualizado",
        description: "El contacto ha sido actualizado exitosamente en HubSpot.",
      });

      return {
        success: true,
        updated: true,
        contact: data.contact,
        message: data.message,
        hubspotId: data.contact?.hubspotId
      };

    } catch (error) {
      console.error('Error updating contact in HubSpot:', error);
      
      return {
        success: false,
        error: error.message || 'Error al actualizar el contacto en HubSpot'
      };
    }
  };

  // Legacy method for backwards compatibility
  const validateEmail = searchContactInHubSpot;

  const clearValidation = () => {
    setValidationMessage(null);
    setIsContactFound(null);
  };

  return {
    // New methods
    searchContactInHubSpot,
    createContactInHubSpot,
    updateContactInHubSpot,
    
    // Legacy methods for backwards compatibility
    validateEmail,
    
    // State
    clearValidation,
    isValidating,
    validationMessage,
    isContactFound
  };
};
