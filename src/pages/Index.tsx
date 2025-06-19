
import React, { useState } from 'react';
import DashboardNegocios from '@/components/DashboardNegocios';
import WizardCrearNegocio from '@/components/WizardCrearNegocio';
import DetalleNegocio from '@/components/DetalleNegocio';

type Vista = 'dashboard' | 'crear-negocio' | 'detalle-negocio';

const Index = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {vistaActual === 'dashboard' && (
          <DashboardNegocios
            onCrearNegocio={navegarACrearNegocio}
            onVerNegocio={navegarADetalleNegocio}
          />
        )}

        {vistaActual === 'crear-negocio' && (
          <WizardCrearNegocio
            onComplete={completarCreacionNegocio}
            onCancel={volverADashboard}
          />
        )}

        {vistaActual === 'detalle-negocio' && negocioSeleccionado && (
          <DetalleNegocio
            negocioId={negocioSeleccionado}
            onVolver={volverADashboard}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
