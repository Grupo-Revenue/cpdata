
import React, { useState } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { Loader2 } from 'lucide-react';
import CrearPresupuesto from './CrearPresupuesto';
import { useNavigate } from 'react-router-dom';
import DetalleNegocioHeader from './negocio/DetalleNegocioHeader';
import ValorNegocioCard from './negocio/ValorNegocioCard';
import ContactoEmpresasCard from './negocio/ContactoEmpresasCard';
import EventoCard from './negocio/EventoCard';
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando negocio...</p>
        </div>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div className="text-center py-8">
        <p>Negocio no encontrado</p>
        <Button onClick={onVolver} className="mt-4">Volver</Button>
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <DetalleNegocioHeader negocio={negocio} onVolver={onVolver} />

      {/* Valor del Negocio - Full width, prominent */}
      <ValorNegocioCard negocio={negocio} onCrearPresupuesto={handleCrearPresupuesto} />

      {/* Two column layout for main info */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left column - Contacto y Empresas */}
        <div className="xl:col-span-1">
          <ContactoEmpresasCard 
            contacto={negocio.contacto} 
            productora={negocio.productora} 
            clienteFinal={negocio.clienteFinal} 
          />
        </div>

        {/* Right column - Event info */}
        <div className="xl:col-span-2">
          <EventoCard evento={negocio.evento} />
        </div>
      </div>

      {/* Presupuestos - Full width */}
      <PresupuestosCard
        presupuestos={negocio.presupuestos}
        onCrearPresupuesto={handleCrearPresupuesto}
        onEditarPresupuesto={handleEditarPresupuesto}
        onEliminarPresupuesto={handleEliminarPresupuesto}
        onVerPDF={handleVerPDF}
        onCambiarEstado={handleCambiarEstadoPresupuesto}
      />
    </div>
  );
};

export default DetalleNegocio;
