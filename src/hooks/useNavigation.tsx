
import { useState } from 'react';

type Vista = 'dashboard' | 'crear-negocio' | 'detalle-negocio' | 'presupuesto-pdf';

export const useNavigation = () => {
  const [vistaActual, setVistaActual] = useState<Vista>('dashboard');
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<string | null>(null);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<string | null>(null);

  const navegarACrearNegocio = () => {
    setVistaActual('crear-negocio');
  };

  const navegarADetalleNegocio = (negocioId: string) => {
    setNegocioSeleccionado(negocioId);
    setVistaActual('detalle-negocio');
  };

  const navegarAPresupuestoPDF = (negocioId: string, presupuestoId: string) => {
    setNegocioSeleccionado(negocioId);
    setPresupuestoSeleccionado(presupuestoId);
    setVistaActual('presupuesto-pdf');
  };

  const volverADashboard = () => {
    setVistaActual('dashboard');
    setNegocioSeleccionado(null);
    setPresupuestoSeleccionado(null);
  };

  const completarCreacionNegocio = (negocioId: string) => {
    setNegocioSeleccionado(negocioId);
    setVistaActual('detalle-negocio');
  };

  return {
    vistaActual,
    negocioSeleccionado,
    presupuestoSeleccionado,
    navegarACrearNegocio,
    navegarADetalleNegocio,
    navegarAPresupuestoPDF,
    volverADashboard,
    completarCreacionNegocio
  };
};
