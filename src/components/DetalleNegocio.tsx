
import React, { useState } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import CrearPresupuesto from './CrearPresupuesto';
import BusinessDetailHeader from './negocio/BusinessDetailHeader';
import DetalleNegocioMainContent from './negocio/DetalleNegocioMainContent';
import LoadingState from './negocio/LoadingState';
import BusinessNotFound from './negocio/BusinessNotFound';
import ConflictHandler from './negocio/ConflictHandler';
import { useBusinessDetailActions } from './negocio/BusinessDetailActions';

interface DetalleNegocioProps {
  negocioId: string;
  onVolver: () => void;
}

const DetalleNegocio: React.FC<DetalleNegocioProps> = ({ negocioId, onVolver }) => {
  const { obtenerNegocio, loading } = useNegocio();
  const [mostrarCrearPresupuesto, setMostrarCrearPresupuesto] = useState(false);
  const [presupuestoEditando, setPresupuestoEditando] = useState<string | null>(null);

  const negocio = obtenerNegocio(negocioId);

  const {
    handleEliminarPresupuesto,
    handleVerPDF,
    handleCambiarEstadoPresupuesto,
    handleCambiarEstadoNegocio,
    handleRefresh
  } = useBusinessDetailActions(negocioId);

  if (loading && !negocio) {
    return <LoadingState />;
  }

  if (!negocio) {
    return <BusinessNotFound onVolver={onVolver} />;
  }

  const handleEditarPresupuesto = (presupuestoId: string) => {
    setPresupuestoEditando(presupuestoId);
    setMostrarCrearPresupuesto(true);
  };

  const handleCrearPresupuesto = () => {
    setMostrarCrearPresupuesto(true);
  };

  const handleCerrarCrearPresupuesto = () => {
    setMostrarCrearPresupuesto(false);
    setPresupuestoEditando(null);
  };

  if (mostrarCrearPresupuesto) {
    return (
      <div className="w-full">
        <CrearPresupuesto
          negocioId={negocioId}
          presupuestoId={presupuestoEditando}
          onCerrar={handleCerrarCrearPresupuesto}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6 max-w-6xl">
          <BusinessDetailHeader
            negocio={negocio}
            onVolver={onVolver}
            onCrearPresupuesto={handleCrearPresupuesto}
            onCambiarEstado={handleCambiarEstadoNegocio}
          />
          
          <DetalleNegocioMainContent
            negocio={negocio}
            onCrearPresupuesto={handleCrearPresupuesto}
            onEditarPresupuesto={handleEditarPresupuesto}
            onEliminarPresupuesto={handleEliminarPresupuesto}
            onVerPDF={handleVerPDF}
            onCambiarEstado={handleCambiarEstadoPresupuesto}
            onCambiarEstadoNegocio={handleCambiarEstadoNegocio}
            onRefresh={handleRefresh}
          />
        </div>
      </main>

      {/* Conflict Resolution Handler */}
      <ConflictHandler negocio={negocio} />
    </div>
  );
};

export default DetalleNegocio;
