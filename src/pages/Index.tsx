
import React, { useEffect } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { useNegocio } from '@/context/NegocioContext';

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
  
  const { negocios, loading, obtenerNegocio } = useNegocio();

  console.log('[Index] ==> RENDERING INDEX COMPONENT <==');
  console.log('[Index] Current state:', {
    vistaActual,
    negocioSeleccionado,
    negociosCount: negocios.length,
    loading
  });

  // Basic monitoring
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      console.log('[Index] Loaded businesses:', negocios.length);
      console.log('[Index] Current view:', vistaActual);
      console.log('[Index] Selected business:', negocioSeleccionado);
    }
  }, [negocios, loading, vistaActual, negocioSeleccionado]);

  // Verify business data when navigating to detail view
  useEffect(() => {
    if (vistaActual === 'detalle-negocio' && negocioSeleccionado) {
      console.log('[Index] ==> VERIFYING BUSINESS DATA FOR DETAIL VIEW <==');
      console.log('[Index] Looking for negocioId:', negocioSeleccionado);
      
      const negocio = obtenerNegocio(negocioSeleccionado);
      console.log('[Index] Found negocio:', !!negocio);
      
      if (negocio) {
        console.log('[Index] Negocio details:', {
          id: negocio.id,
          numero: negocio.numero,
          contacto: negocio.contacto?.nombre,
          evento: negocio.evento?.nombreEvento
        });
      } else {
        console.error('[Index] ERROR: Negocio not found for ID:', negocioSeleccionado);
        console.log('[Index] Available negocios IDs:', negocios.map(n => n.id));
      }
    }
  }, [vistaActual, negocioSeleccionado, obtenerNegocio, negocios]);

  console.log('[Index] Deciding which view to render...');

  if (vistaActual === 'crear-negocio') {
    console.log('[Index] ==> RENDERING CreateBusinessView <==');
    return (
      <CreateBusinessView
        onComplete={completarCreacionNegocio}
        onCancel={volverADashboard}
      />
    );
  }

  if (vistaActual === 'detalle-negocio' && negocioSeleccionado) {
    console.log('[Index] ==> RENDERING BusinessDetailView <==');
    console.log('[Index] BusinessDetailView props:', {
      negocioId: negocioSeleccionado,
      hasOnVolver: !!volverADashboard
    });
    
    return (
      <BusinessDetailView
        negocioId={negocioSeleccionado}
        onVolver={volverADashboard}
      />
    );
  }

  console.log('[Index] ==> RENDERING DashboardView (default) <==');
  return (
    <DashboardView
      onCrearNegocio={navegarACrearNegocio}
      onVerNegocio={navegarADetalleNegocio}
    />
  );
};

export default Index;
