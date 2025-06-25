
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

  // Monitor business state consistency on app load with enhanced monitoring
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      console.log('[Index] Performing initial enhanced state validation...');
      
      // Run initial validation
      setTimeout(() => {
        validateCurrentStates();
      }, 1000);

      // Run comprehensive audit if inconsistencies are detected after initial validation
      setTimeout(() => {
        if (inconsistencyCount > 0) {
          console.log(`[Index] Found ${inconsistencyCount} inconsistencies, running comprehensive audit...`);
          runComprehensiveAudit();
        }
      }, 3000);
    }
  }, [negocios, loading, inconsistencyCount, validateCurrentStates, runComprehensiveAudit]);

  if (vistaActual === 'crear-negocio') {
    return (
      <CreateBusinessView
        onComplete={completarCreacionNegocio}
        onCancel={volverADashboard}
      />
    );
  }

  if (vistaActual === 'detalle-negocio' && negocioSeleccionado) {
    return (
      <BusinessDetailView
        negocioId={negocioSeleccionado}
        onVolver={volverADashboard}
      />
    );
  }

  return (
    <DashboardView
      onCrearNegocio={navegarACrearNegocio}
      onVerNegocio={navegarADetalleNegocio}
    />
  );
};

export default Index;
