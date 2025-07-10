import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useHubSpotConnectionStatus } from './useHubSpotConnectionStatus';

interface DealData {
  nombre_correlativo: string;
  tipo_evento: string;
  nombre_evento: string;
  valor_negocio: number;
  fecha_evento: string;
  fecha_evento_fin?: string;
  horario_inicio?: string;
  horario_fin?: string;
  fecha_cierre?: string;
  locacion: string;
  cantidad_invitados: number;
  cantidad_asistentes: number;
  contactId: string;
  productoraId?: string;
  clienteFinalId?: string;
}

interface DealCreationResult {
  success: boolean;
  deal?: {
    hubspotId: string;
    dealname: string;
  };
  error?: string;
}

interface CorrelativeResult {
  success: boolean;
  correlative?: string;
  error?: string;
}

export const useHubSpotDealCreation = () => {
  const { isConnected } = useHubSpotConnectionStatus();
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingCorrelative, setIsGeneratingCorrelative] = useState(false);

  const generateUniqueCorrelative = async (): Promise<CorrelativeResult> => {
    if (!isConnected) {
      console.log('[HubSpot Deal] Not connected, cannot generate correlative');
      toast({
        title: "Sin conexión a HubSpot",
        description: "Configure la conexión a HubSpot en la sección de Configuración.",
        variant: "destructive"
      });
      return { success: false, error: 'No está conectado a HubSpot' };
    }

    setIsGeneratingCorrelative(true);
    
    try {
      console.log('[HubSpot Deal] Invoking correlative generation function');
      
      const { data, error } = await supabase.functions.invoke('hubspot-deal-creation', {
        body: {
          action: 'generate_correlative'
        }
      });

      console.log('[HubSpot Deal] Correlative function response:', { data, error });

      if (error) {
        console.error('[HubSpot Deal] Function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        console.error('[HubSpot Deal] Function returned error:', data?.error);
        throw new Error(data?.error || 'Error generando número correlativo');
      }

      return {
        success: true,
        correlative: data.correlative
      };

    } catch (error) {
      console.error('Error generating correlative:', error);
      
      return {
        success: false,
        error: error.message || 'Error generando número correlativo'
      };
    } finally {
      setIsGeneratingCorrelative(false);
    }
  };

  const createDealInHubSpot = async (dealData: DealData): Promise<DealCreationResult> => {
    if (!isConnected) {
      toast({
        title: "Sin conexión a HubSpot",
        description: "Configure la conexión a HubSpot en la sección de Configuración.",
        variant: "destructive"
      });
      return { success: false, error: 'No está conectado a HubSpot' };
    }

    setIsCreating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-deal-creation', {
        body: {
          action: 'create_deal',
          dealData
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error creando negocio en HubSpot');
      }

      toast({
        title: "Negocio creado en HubSpot",
        description: `El negocio ${dealData.nombre_correlativo} ha sido creado exitosamente.`,
      });

      return {
        success: true,
        deal: data.deal
      };

    } catch (error) {
      console.error('Error creating deal in HubSpot:', error);
      
      toast({
        title: "Error creando negocio",
        description: "No se pudo crear el negocio en HubSpot. Por favor, intente nuevamente.",
        variant: "destructive"
      });

      return {
        success: false,
        error: error.message || 'Error creando negocio en HubSpot'
      };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    generateUniqueCorrelative,
    createDealInHubSpot,
    isCreating,
    isGeneratingCorrelative
  };
};