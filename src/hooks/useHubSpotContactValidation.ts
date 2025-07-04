
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ContactData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo?: string;
}

interface ValidationResult {
  found: boolean;
  contact?: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  };
  message?: string;
}

export const useHubSpotContactValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isContactFound, setIsContactFound] = useState<boolean | null>(null);

  const validateEmail = async (email: string): Promise<ValidationResult | null> => {
    if (!email || !email.includes('@')) {
      setValidationMessage(null);
      setIsContactFound(null);
      return null;
    }

    setIsValidating(true);
    setValidationMessage(null);
    setIsContactFound(null);

    try {
      const { data, error } = await supabase.functions.invoke('hubspot-contact-validation', {
        body: {
          action: 'search',
          email: email.trim()
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error al validar el correo');
      }

      if (data.found) {
        setValidationMessage('El contacto fue encontrado en HubSpot y sus datos han sido completados automáticamente.');
        setIsContactFound(true);
        toast({
          title: "Contacto encontrado",
          description: "Los datos del contacto han sido completados automáticamente desde HubSpot.",
        });
      } else {
        setValidationMessage('El contacto no existe en HubSpot. Por favor ingrese los datos restantes para crearlo.');
        setIsContactFound(false);
        toast({
          title: "Contacto no encontrado",
          description: "Complete los datos para crear un nuevo contacto.",
          variant: "default"
        });
      }

      return data;

    } catch (error) {
      console.error('Error validating email:', error);
      setValidationMessage('No se pudo validar el correo electrónico. Verifique su conexión con HubSpot.');
      setIsContactFound(null);
      toast({
        title: "Error de validación",
        description: "No se pudo validar el correo electrónico. Verifique su conexión con HubSpot.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const createContactInHubSpot = async (contactData: ContactData): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-contact-validation', {
        body: {
          action: 'create',
          contactData
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

      return true;

    } catch (error) {
      console.error('Error creating contact in HubSpot:', error);
      toast({
        title: "Error al crear contacto",
        description: "No se pudo crear el contacto en HubSpot. El negocio se guardará sin sincronizar.",
        variant: "destructive"
      });
      return false;
    }
  };

  const clearValidation = () => {
    setValidationMessage(null);
    setIsContactFound(null);
  };

  return {
    validateEmail,
    createContactInHubSpot,
    clearValidation,
    isValidating,
    validationMessage,
    isContactFound
  };
};
