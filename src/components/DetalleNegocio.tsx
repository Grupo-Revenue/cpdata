
import React, { useState } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { Loader2 } from 'lucide-react';
import CrearPresupuesto from './CrearPresupuesto';
import { useNavigate } from 'react-router-dom';
import DetalleNegocioHeader from './negocio/DetalleNegocioHeader';
import InformacionGeneralCard from './negocio/InformacionGeneralCard';
import PresupuestosCard from './negocio/PresupuestosCard';
import { Button } from '@/components/ui/button';

interface DetalleNegocioProps {
  negocioId: string;
  onVolver: () => void;
}

const DetalleNegocio: React.FC<DetalleNegocioProps> = ({ negocioId, onVolver }) => {
  const { obtenerNegocio, eliminarPresupuesto, cambiarEstadoPresupuesto, loading } = useNegocio();
  const navigate = useNavigate();
  const [mostrarCrearPresupuesto, setMostrarCrearPresupuesto] = useState(false);
  const [presupuestoEditando, setPresupuestoEditando] = useState<string | null>(null);

  const negocio = obtenerNegocio(negocioId);

  if (loading && !negocio) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">Cargando negocio...</p>
        </div>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Negocio no encontrado</p>
        <Button onClick={onVolver} variant="outline">Volver</Button>
      </div>
    );
  }

  const handleEliminarPresupuesto = async (presupuestoId: string) => {
    await eliminarPresupuesto(negocioId, presupuestoId);
  };

  const handleVerPDF = (presupuestoId: string) => {
    navigate(`/presupuesto/${negocioId}/${presupuestoId}/pdf`);
  };

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

  const handleCambiarEstadoPresupuesto = async (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => {
    await cambiarEstadoPresupuesto(negocioId, presupuestoId, nuevoEstado, fechaVencimiento);
  };

  if (mostrarCrearPresupuesto) {
    return (
      <CrearPresupuesto
        negocioId={negocioId}
        presupuestoId={presupuestoEditando}
        onCerrar={handleCerrarCrearPresupuesto}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <DetalleNegocioHeader negocio={negocio} onVolver={onVolver} />

        {/* General Information */}
        <InformacionGeneralCard 
          contacto={negocio.contacto} 
          productora={negocio.productora} 
          clienteFinal={negocio.clienteFinal}
          evento={negocio.evento}
        />

        {/* Budgets */}
        <PresupuestosCard
          negocio={negocio}
          onCrearPresupuesto={handleCrearPresupuesto}
          onEditarPresupuesto={handleEditarPresupuesto}
          onEliminarPresupuesto={handleEliminarPresupuesto}
          onVerPDF={handleVerPDF}
          onCambiarEstado={handleCambiarEstadoPresupuesto}
        />
      </div>
    </div>
  );
};

export default DetalleNegocio;
