import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CompanyData {
  nombre: string;
  tipoCliente: 'productora' | 'cliente_final';
  rut?: string;
  direccion?: string;
  sitio_web?: string;
  hubspotId?: string;
}

interface HubSpotCompany {
  hubspotId: string;
  name: string;
  tipoCliente: string;
  rut: string;
  address: string;
}

interface ValidationResult {
  found: boolean;
  company?: HubSpotCompany;
  message?: string;
}

interface CreateUpdateResult {
  success: boolean;
  company?: HubSpotCompany;
  created?: boolean;
  updated?: boolean;
  message?: string;
  error?: string;
}

export const useHubSpotCompanyValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isCompanyFound, setIsCompanyFound] = useState<boolean | null>(null);

  const searchCompanyInHubSpot = async (companyName: string): Promise<ValidationResult | null> => {
    if (!companyName || companyName.trim().length === 0) {
      setValidationMessage(null);
      setIsCompanyFound(null);
      return null;
    }

    setIsValidating(true);
    setValidationMessage(null);
    setIsCompanyFound(null);

    try {
      const { data, error } = await supabase.functions.invoke('hubspot-company-validation', {
        body: {
          action: 'search',
          companyName: companyName.trim()
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error al buscar la empresa');
      }

      if (data.found) {
        setValidationMessage('La empresa fue encontrada en HubSpot y sus datos han sido completados automáticamente.');
        setIsCompanyFound(true);
        toast({
          title: "Empresa encontrada",
          description: "Los datos de la empresa han sido completados automáticamente desde HubSpot.",
        });
      } else {
        setValidationMessage('La empresa no existe en HubSpot. Se creará una nueva al finalizar.');
        setIsCompanyFound(false);
        toast({
          title: "Empresa no encontrada",
          description: "Se creará una nueva empresa en HubSpot al finalizar el proceso.",
          variant: "default"
        });
      }

      return data;

    } catch (error) {
      console.error('Error searching company:', error);
      setValidationMessage('No se pudo buscar la empresa en HubSpot. Verifique su conexión.');
      setIsCompanyFound(null);
      toast({
        title: "Error de búsqueda",
        description: "No se pudo buscar la empresa en HubSpot. Verifique su conexión.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const createCompanyInHubSpot = async (companyData: CompanyData): Promise<CreateUpdateResult> => {
    try {
      // Map tipo_cliente to HubSpot format
      const hubspotTipoCliente = companyData.tipoCliente === 'cliente_final' ? 'Cliente Final' : 'Productora';
      
      const { data, error } = await supabase.functions.invoke('hubspot-company-validation', {
        body: {
          action: 'create',
          companyData: {
            ...companyData,
            tipoCliente: hubspotTipoCliente
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error al crear la empresa');
      }

      toast({
        title: "Empresa creada",
        description: "La empresa ha sido creada exitosamente en HubSpot.",
      });

      return {
        success: true,
        created: true,
        company: data.company,
        message: data.message
      };

    } catch (error) {
      console.error('Error creating company in HubSpot:', error);
      
      return {
        success: false,
        error: error.message || 'Error al crear la empresa en HubSpot'
      };
    }
  };

  const updateCompanyInHubSpot = async (companyData: CompanyData): Promise<CreateUpdateResult> => {
    try {
      // Map tipo_cliente to HubSpot format
      const hubspotTipoCliente = companyData.tipoCliente === 'cliente_final' ? 'Cliente Final' : 'Productora';
      
      const { data, error } = await supabase.functions.invoke('hubspot-company-validation', {
        body: {
          action: 'update',
          companyData: {
            ...companyData,
            tipoCliente: hubspotTipoCliente
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error al actualizar la empresa');
      }

      toast({
        title: "Empresa actualizada",
        description: "La empresa ha sido actualizada exitosamente en HubSpot.",
      });

      return {
        success: true,
        updated: true,
        company: data.company,
        message: data.message
      };

    } catch (error) {
      console.error('Error updating company in HubSpot:', error);
      
      return {
        success: false,
        error: error.message || 'Error al actualizar la empresa en HubSpot'
      };
    }
  };

  const clearValidation = () => {
    setValidationMessage(null);
    setIsCompanyFound(null);
  };

  return {
    searchCompanyInHubSpot,
    createCompanyInHubSpot,
    updateCompanyInHubSpot,
    clearValidation,
    isValidating,
    validationMessage,
    isCompanyFound
  };
};