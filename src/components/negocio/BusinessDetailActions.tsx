
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
    try {
      console.log('🚀 [BusinessDetailActions] === INICIO CAMBIO ESTADO ===');
      console.log('🚀 [BusinessDetailActions] Parámetros:', { negocioId, presupuestoId, nuevoEstado, fechaVencimiento });
      
      await cambiarEstadoPresupuesto(negocioId, presupuestoId, nuevoEstado as EstadoPresupuesto, fechaVencimiento);
      
      console.log('✅ [BusinessDetailActions] Cambio de estado completado exitosamente');
      
      toast({
        title: "Estado actualizado",
        description: "El estado del presupuesto se ha actualizado correctamente."
      });
    } catch (error) {
      console.error('❌ [BusinessDetailActions] Error cambiando estado:', error);
      
      toast({
        variant: "destructive",
        title: "Error al cambiar estado",
        description: error instanceof Error ? error.message : "No se pudo cambiar el estado del presupuesto."
      });
      
      throw error;
    }
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
