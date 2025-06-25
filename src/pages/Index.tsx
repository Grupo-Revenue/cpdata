
import React, { useEffect } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { useNegocio } from '@/context/NegocioContext';
import { useBusinessStateMonitor } from '@/hooks/useBusinessStateMonitor';
import DashboardView from '@/pages/DashboardView';
import CreateBusinessView from '@/pages/CreateBusinessView';
import BusinessDetailView from '@/pages/BusinessDetailView';

const Index = () => {
  const {
    vistaActual,
    negocioSeleccionado,
    navegarACrearNegocio,
    navegarADetalleNegocio,
    volverADashboard,
    completarCreacionNegocio
  } = useNavigation();
  
  const { negocios, loading } = useNegocio();
  const { 
    inconsistencyCount, 
    validateCurrentStates,
    runComprehensiveAudit
  } = useBusinessStateMonitor();

  // Enhanced monitoring with better error handling
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      console.log('[Index] Performing initial enhanced state validation...');
      console.log('[Index] Current view:', vistaActual);
      console.log('[Index] Selected business:', negocioSeleccionado);
      console.log('[Index] Available businesses:', negocios.length);
      
      // Run initial validation with error handling
      setTimeout(() => {
        try {
          validateCurrentStates();
        } catch (error) {
          console.error('[Index] Error during state validation:', error);
        }
      }, 1000);

      // Run comprehensive audit if inconsistencies are detected
      setTimeout(() => {
        if (inconsistencyCount > 0) {
          console.log(`[Index] Found ${inconsistencyCount} inconsistencies, running comprehensive audit...`);
          try {
            runComprehensiveAudit();
          } catch (error) {
            console.error('[Index] Error during comprehensive audit:', error);
          }
        }
      }, 3000);
    }
  }, [negocios, loading, inconsistencyCount, validateCurrentStates, runComprehensiveAudit]);

  console.log('[Index] Rendering view:', vistaActual);

  if (vistaActual === 'crear-negocio') {
    console.log('[Index] Rendering CreateBusinessView');
    return (
      <CreateBusinessView
        onComplete={completarCreacionNegocio}
        onCancel={volverADashboard}
      />
    );
  }

  if (vistaActual === 'detalle-negocio' && negocioSeleccionado) {
    console.log('[Index] Rendering BusinessDetailView for:', negocioSeleccionado);
    return (
      <BusinessDetailView
        negocioId={negocioSeleccionado}
        onVolver={volverADashboard}
      />
    );
  }

  console.log('[Index] Rendering DashboardView (default)');
  return (
    <DashboardView
      onCrearNegocio={navegarACrearNegocio}
      onVerNegocio={navegarADetalleNegocio}
    />
  );
};

export default Index;
