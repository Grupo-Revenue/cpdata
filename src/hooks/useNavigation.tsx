
import { useState } from 'react';

type Vista = 'dashboard' | 'crear-negocio' | 'detalle-negocio' | 'presupuesto-pdf';

export const useNavigation = () => {
  const [vistaActual, setVistaActual] = useState<Vista>('dashboard');
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<string | null>(null);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<string | null>(null);

  const navegarACrearNegocio = () => {
    console.log('[useNavigation] Navigating to crear-negocio');
    setVistaActual('crear-negocio');
  };

  const navegarADetalleNegocio = (negocioId: string) => {
    console.log('[useNavigation] Navigating to detalle-negocio for:', negocioId);
    setNegocioSeleccionado(negocioId);
    setVistaActual('detalle-negocio');
  };

  const navegarAPresupuestoPDF = (negocioId: string, presupuestoId: string) => {
    console.log('[useNavigation] Navigating to presupuesto-pdf for:', { negocioId, presupuestoId });
    setNegocioSeleccionado(negocioId);
    setPresupuestoSeleccionado(presupuestoId);
    setVistaActual('presupuesto-pdf');
  };

  const volverADashboard = () => {
    console.log('[useNavigation] Returning to dashboard');
    setVistaActual('dashboard');
    setNegocioSeleccionado(null);
    setPresupuestoSeleccionado(null);
  };

  const completarCreacionNegocio = (negocioId: string) => {
    console.log('[useNavigation] Completing business creation for:', negocioId);
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
