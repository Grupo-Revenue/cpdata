
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '@/context/NegocioContext';
import { EstadoPresupuesto, EstadoNegocio } from '@/types';

interface BusinessDetailActionsProps {
  negocioId: string;
}

export const useBusinessDetailActions = (negocioId: string) => {
  const { eliminarPresupuesto, cambiarEstadoPresupuesto, cambiarEstadoNegocio } = useNegocio();
  const navigate = useNavigate();

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
    await cambiarEstadoNegocio(negocioId, nuevoEstado as EstadoNegocio);
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
