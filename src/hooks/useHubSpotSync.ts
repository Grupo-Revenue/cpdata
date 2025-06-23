
import { useState } from 'react';
import { useHubSpotConfig } from './useHubSpotConfig';
import { useNegocio } from '@/context/NegocioContext';
import { useToast } from './use-toast';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import { Negocio } from '@/types';

export const useHubSpotSync = () => {
  const { syncNegocio } = useHubSpotConfig();
  const { obtenerNegocio } = useNegocio();
  const { toast } = useToast();
  const [syncingNegocios, setSyncingNegocios] = useState<Set<string>>(new Set());

  const isSyncing = (negocioId: string) => syncingNegocios.has(negocioId);

  const manualSyncNegocio = async (negocioId: string) => {
    const negocio = obtenerNegocio(negocioId);
    if (!negocio) {
      toast({
        title: "Error",
        description: "Negocio no encontrado",
        variant: "destructive"
      });
      return;
    }

    setSyncingNegocios(prev => new Set(prev).add(negocioId));

    try {
      const valorTotal = calcularValorNegocio(negocio);
      const hubspotData = {
        id: negocio.id,
        numero: negocio.numero,
        contacto: negocio.contacto,
        evento: negocio.evento,
        valorTotal: valorTotal
      };

      const result = await syncNegocio(hubspotData, 'update');
      
      if (result.success && !result.skipped) {
        toast({
          title: "Sincronización exitosa",
          description: "El negocio se ha sincronizado con HubSpot correctamente"
        });
      } else if (result.skipped) {
        toast({
          title: "Sincronización omitida",
          description: "HubSpot no está configurado o la sincronización está deshabilitada",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error syncing business:', error);
      toast({
        title: "Error de sincronización",
        description: "No se pudo sincronizar el negocio con HubSpot",
        variant: "destructive"
      });
    } finally {
      setSyncingNegocios(prev => {
        const newSet = new Set(prev);
        newSet.delete(negocioId);
        return newSet;
      });
    }
  };

  const isBusinessSynced = (negocio: Negocio) => {
    // For now, we'll consider a business synced if it has been created recently
    // In a real implementation, you might want to track sync status in the database
    return false; // Placeholder - always show as not synced for now
  };

  return {
    manualSyncNegocio,
    isSyncing,
    isBusinessSynced
  };
};
