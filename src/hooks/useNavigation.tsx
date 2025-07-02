
import { useState } from 'react';

type Vista = 'dashboard' | 'crear-negocio' | 'detalle-negocio' | 'presupuesto-pdf';

export const useNavigation = () => {
  const [vistaActual, setVistaActual] = useState<Vista>('dashboard');
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<string | null>(null);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<string | null>(null);

  const navegarACrearNegocio = () => {
    console.log('[useNavigation] ==> NAVIGATING TO crear-negocio <==');
    setVistaActual('crear-negocio');
  };

  const navegarADetalleNegocio = (negocioId: string) => {
    console.log('[useNavigation] ==> NAVIGATING TO detalle-negocio <==');
    console.log('[useNavigation] Received negocioId:', negocioId);
    console.log('[useNavigation] negocioId type:', typeof negocioId);
    console.log('[useNavigation] negocioId length:', negocioId?.length);
    
    if (!negocioId) {
      console.error('[useNavigation] ERROR: negocioId is empty or undefined!');
      return;
    }
    
    console.log('[useNavigation] Setting negocioSeleccionado to:', negocioId);
    setNegocioSeleccionado(negocioId);
    console.log('[useNavigation] Setting vistaActual to: detalle-negocio');
    setVistaActual('detalle-negocio');
    console.log('[useNavigation] Navigation state updated successfully');
  };

  const navegarAPresupuestoPDF = (negocioId: string, presupuestoId: string) => {
    console.log('[useNavigation] ==> NAVIGATING TO presupuesto-pdf <==');
    console.log('[useNavigation] negocioId:', negocioId, 'presupuestoId:', presupuestoId);
    setNegocioSeleccionado(negocioId);
    setPresupuestoSeleccionado(presupuestoId);
    setVistaActual('presupuesto-pdf');
  };

  const volverADashboard = () => {
    console.log('[useNavigation] ==> RETURNING TO dashboard <==');
    setVistaActual('dashboard');
    setNegocioSeleccionado(null);
    setPresupuestoSeleccionado(null);
  };

  const completarCreacionNegocio = (negocioId: string) => {
    console.log('[useNavigation] ==> COMPLETING BUSINESS CREATION <==');
    console.log('[useNavigation] Created negocioId:', negocioId);
    setNegocioSeleccionado(negocioId);
    setVistaActual('detalle-negocio');
  };

  // Debug logging for current state
  console.log('[useNavigation] Current state:', {
    vistaActual,
    negocioSeleccionado,
    presupuestoSeleccionado
  });

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
