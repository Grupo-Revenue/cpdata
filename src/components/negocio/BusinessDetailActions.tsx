
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '@/context/NegocioContext';
import { EstadoPresupuesto } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useManualHubSpotSync } from '@/hooks/hubspot/useManualHubSpotSync';

interface BusinessDetailActionsProps {
  negocioId: string;
}

export const useBusinessDetailActions = (negocioId: string) => {
  const { eliminarPresupuesto, cambiarEstadoPresupuesto, refreshNegocios } = useNegocio();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { syncNegocioToHubSpot } = useManualHubSpotSync();

  const handleEliminarPresupuesto = async (presupuestoId: string): Promise<void> => {
    await eliminarPresupuesto(negocioId, presupuestoId);
  };

  const handleVerPDF = (presupuestoId: string) => {
    navigate(`/presupuesto/${negocioId}/${presupuestoId}/pdf`);
  };

  const handleCambiarEstadoPresupuesto = async (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string): Promise<void> => {
    await cambiarEstadoPresupuesto(negocioId, presupuestoId, nuevoEstado as EstadoPresupuesto, fechaVencimiento);
  };

  const handleRefresh = async () => {
    try {
      await refreshNegocios();
      toast({
        title: "Datos actualizados",
        description: "La información del negocio se ha actualizado correctamente."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la información del negocio."
      });
    }
  };

  const handleSyncToHubSpot = async () => {
    await syncNegocioToHubSpot(negocioId);
  };

  return {
    handleEliminarPresupuesto,
    handleVerPDF,
    handleCambiarEstadoPresupuesto,
    handleRefresh,
    handleSyncToHubSpot
  };
};

// This is just a placeholder component since we're using a custom hook
const BusinessDetailActions: React.FC<BusinessDetailActionsProps> = () => {
  return null;
};

export default BusinessDetailActions;
