
import { useState } from 'react';

type Vista = 'dashboard' | 'crear-negocio' | 'detalle-negocio';

export const useNavigation = () => {
  const [vistaActual, setVistaActual] = useState<Vista>('dashboard');
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<string | null>(null);

  const navegarACrearNegocio = () => {
    setVistaActual('crear-negocio');
  };

  const navegarADetalleNegocio = (negocioId: string) => {
    setNegocioSeleccionado(negocioId);
    setVistaActual('detalle-negocio');
  };

  const volverADashboard = () => {
    setVistaActual('dashboard');
    setNegocioSeleccionado(null);
  };

  const completarCreacionNegocio = (negocioId: string) => {
    setNegocioSeleccionado(negocioId);
    setVistaActual('detalle-negocio');
  };

  return {
    vistaActual,
    negocioSeleccionado,
    navegarACrearNegocio,
    navegarADetalleNegocio,
    volverADashboard,
    completarCreacionNegocio
  };
};
