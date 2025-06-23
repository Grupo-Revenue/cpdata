
import { useState, useEffect } from 'react';
import { useHubSpotConfig } from './useHubSpotConfig';
import { useNegocio } from '@/context/NegocioContext';
import { useToast } from './use-toast';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import { Negocio } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const useHubSpotSync = () => {
  const { syncNegocio } = useHubSpotConfig();
  const { obtenerNegocio } = useNegocio();
  const { toast } = useToast();
  const [syncingNegocios, setSyncingNegocios] = useState<Set<string>>(new Set());
  const [syncedNegocios, setSyncedNegocios] = useState<Set<string>>(new Set());

  const loadSyncedNegocios = async () => {
    try {
      const { data, error } = await supabase
        .from('hubspot_sync')
        .select('negocio_id')
        .eq('sync_status', 'completed');

      if (error) throw error;

      const syncedIds = new Set(data?.map(record => record.negocio_id) || []);
      setSyncedNegocios(syncedIds);
    } catch (error) {
      console.error('Error loading synced negocios:', error);
    }
  };

  useEffect(() => {
    loadSyncedNegocios();
  }, []);

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
        // Add to synced negocios
        setSyncedNegocios(prev => new Set(prev).add(negocioId));
        
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
    return syncedNegocios.has(negocio.id);
  };

  return {
    manualSyncNegocio,
    isSyncing,
    isBusinessSynced
  };
};
