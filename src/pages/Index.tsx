
import React, { useEffect } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { useNegocio } from '@/context/NegocioContext';
import { validateAllBusinessStates } from '@/utils/businessCalculations';
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

  // Monitor business state consistency on app load
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      console.log('[Index] Performing initial state validation...');
      
      // Run validation in background
      setTimeout(() => {
        const results = validateAllBusinessStates(negocios);
        
        if (results.inconsistencies > 0) {
          console.warn(`[Index] Found ${results.inconsistencies} state inconsistencies:`, results.inconsistentBusinesses);
        } else {
          console.log(`[Index] All ${results.totalBusinesses} business states are consistent`);
        }
      }, 2000);
    }
  }, [negocios, loading]);

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
