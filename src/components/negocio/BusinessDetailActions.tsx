
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '@/context/NegocioContext';
import { EstadoPresupuesto, EstadoNegocio } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BusinessDetailActionsProps {
  negocioId: string;
}

export const useBusinessDetailActions = (negocioId: string) => {
  const { eliminarPresupuesto, cambiarEstadoPresupuesto, cambiarEstadoNegocio, obtenerNegocio } = useNegocio();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEliminarPresupuesto = async (presupuestoId: string): Promise<void> => {
    await eliminarPresupuesto(negocioId, presupuestoId);
  };

  const handleVerPDF = (presupuestoId: string) => {
    navigate(`/presupuesto/${negocioId}/${presupuestoId}/pdf`);
  };

  const handleCambiarEstadoPresupuesto = async (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string): Promise<void> => {
    await cambiarEstadoPresupuesto(negocioId, presupuestoId, nuevoEstado as EstadoPresupuesto, fechaVencimiento);
  };

  const handleCambiarEstadoNegocio = async (negocioId: string, nuevoEstado: string) => {
    try {
      const negocio = obtenerNegocio(negocioId);
      
      // Usar el contexto para manejar la actualización
      await cambiarEstadoNegocio(negocioId, nuevoEstado as EstadoNegocio);

      // Si llegamos aquí, la actualización fue exitosa
      if (negocio?.hubspot_id) {
        // Intentar sincronizar con HubSpot
        try {
          const { data: hubspotData, error: hubspotError } = await supabase.functions.invoke('hubspot-deal-update', {
            body: {
              negocio_id: negocioId,
              estado_anterior: negocio.estado,
              estado_nuevo: nuevoEstado
            }
          });

          if (hubspotError) {
            console.warn('Error al sincronizar con HubSpot:', hubspotError);
            toast({
              variant: "destructive",
              title: "Error de sincronización",
              description: "El estado fue actualizado en la aplicación, pero la sincronización con HubSpot falló."
            });
          } else {
            toast({
              title: "Estado actualizado",
              description: "El estado del negocio fue actualizado correctamente y sincronizado con HubSpot."
            });
          }
        } catch (syncError) {
          console.warn('Error al sincronizar con HubSpot:', syncError);
          toast({
            variant: "destructive", 
            title: "Error de sincronización",
            description: "El estado fue actualizado en la aplicación, pero la sincronización con HubSpot falló."
          });
        }
      } else {
        toast({
          title: "Estado actualizado",
          description: "El estado del negocio fue actualizado correctamente."
        });
      }

    } catch (error) {
      console.error('Error al cambiar estado del negocio:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del negocio."
      });
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return {
    handleEliminarPresupuesto,
    handleVerPDF,
    handleCambiarEstadoPresupuesto,
    handleCambiarEstadoNegocio,
    handleRefresh
  };
};

// This is just a placeholder component since we're using a custom hook
const BusinessDetailActions: React.FC<BusinessDetailActionsProps> = () => {
  return null;
};

export default BusinessDetailActions;
