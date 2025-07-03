
import React, { useEffect, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation } from '@/hooks/useNavigation';
import { useNegocio } from '@/context/NegocioContext';
import { logger } from '@/utils/logger';

import { DashboardView, CreateBusinessView, BusinessDetailView } from '@/pages/LazyPages';

const Index = () => {
  const { negocioId } = useParams<{ negocioId: string }>();
  const {
    vistaActual,
    negocioSeleccionado,
    navegarACrearNegocio,
    navegarADetalleNegocio,
    volverADashboard,
    completarCreacionNegocio
  } = useNavigation();
  
  const { negocios, loading, obtenerNegocio } = useNegocio();

  // Navigate to business detail if negocioId is in URL
  useEffect(() => {
    if (negocioId && !loading && negocios.length > 0) {
      const negocio = obtenerNegocio(negocioId);
      if (negocio && vistaActual !== 'detalle-negocio') {
        navegarADetalleNegocio(negocioId);
      }
    }
  }, [negocioId, negocios, loading, obtenerNegocio, navegarADetalleNegocio, vistaActual]);

  // Verify business data when navigating to detail view
  useEffect(() => {
    if (vistaActual === 'detalle-negocio' && negocioSeleccionado) {
      const negocio = obtenerNegocio(negocioSeleccionado);
      if (!negocio) {
        logger.error('Negocio not found for ID', null, { negocioSeleccionado, availableIds: negocios.map(n => n.id) });
      }
    }
  }, [vistaActual, negocioSeleccionado, obtenerNegocio, negocios]);

  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (vistaActual === 'crear-negocio') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <CreateBusinessView
          onComplete={completarCreacionNegocio}
          onCancel={volverADashboard}
        />
      </Suspense>
    );
  }

  if (vistaActual === 'detalle-negocio' && negocioSeleccionado) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <BusinessDetailView
          negocioId={negocioSeleccionado}
          onVolver={volverADashboard}
        />
      </Suspense>
    );
  }
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardView
        onCrearNegocio={navegarACrearNegocio}
        onVerNegocio={navegarADetalleNegocio}
      />
    </Suspense>
  );
};

export default Index;
