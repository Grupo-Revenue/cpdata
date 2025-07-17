
import React, { useEffect, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation } from '@/hooks/useNavigation';
import { useNegocio } from '@/context/NegocioContext';
import { logger } from '@/utils/logger';
import DashboardView from '@/pages/DashboardView';
import CreateBusinessView from '@/pages/CreateBusinessView';
import BusinessDetailView from '@/pages/BusinessDetailView';

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
        console.log('📍 [Index] Navigating to business detail:', negocioId);
        navegarADetalleNegocio(negocioId);
      } else if (!negocio && !loading) {
        console.error('❌ [Index] Business not found for URL param:', negocioId);
        logger.error('Business not found for URL param', null, { 
          negocioId, 
          availableIds: negocios.map(n => n.id),
          totalNegocios: negocios.length 
        });
      }
    }
  }, [negocioId, negocios, loading, obtenerNegocio, navegarADetalleNegocio, vistaActual]);

  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (vistaActual === 'crear-negocio') {
    return (
      <CreateBusinessView
        onComplete={completarCreacionNegocio}
        onCancel={volverADashboard}
      />
    );
  }

  // Don't render business detail view until we have the data
  if (vistaActual === 'detalle-negocio' && negocioSeleccionado) {
    // Wait for data to be loaded before rendering
    if (loading) {
      return <LoadingFallback />;
    }
    
    // Check if business exists in loaded data
    const negocio = obtenerNegocio(negocioSeleccionado);
    if (!negocio) {
      console.error('❌ [Index] Business not found in loaded data:', negocioSeleccionado);
      return <LoadingFallback />;
    }
    
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
