
import React, { useState, useEffect } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import { Loader2 } from 'lucide-react';
import CrearPresupuesto from './CrearPresupuesto';
import { useNavigate } from 'react-router-dom';
import BusinessDetailHeader from './negocio/BusinessDetailHeader';
import DetalleNegocioMainContent from './negocio/DetalleNegocioMainContent';
import ConflictResolutionDialog from './business/ConflictResolutionDialog';
import { Button } from '@/components/ui/button';

interface DetalleNegocioProps {
  negocioId: string;
  onVolver: () => void;
}

const DetalleNegocio: React.FC<DetalleNegocioProps> = ({ negocioId, onVolver }) => {
  const { obtenerNegocio, eliminarPresupuesto, cambiarEstadoPresupuesto, cambiarEstadoNegocio, loading } = useNegocio();
  const { syncConflicts, resolveConflict } = useBidirectionalSync();
  const navigate = useNavigate();
  const [mostrarCrearPresupuesto, setMostrarCrearPresupuesto] = useState(false);
  const [presupuestoEditando, setPresupuestoEditando] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);

  const negocio = obtenerNegocio(negocioId);

  // Check for conflicts when component mounts or conflicts change
  useEffect(() => {
    if (negocio && syncConflicts.length > 0) {
      const businessConflict = syncConflicts.find(conflict => conflict.negocio_id === negocio.id);
      if (businessConflict && !conflictDialogOpen) {
        setCurrentConflict(businessConflict);
        setConflictDialogOpen(true);
      }
    }
  }, [negocio, syncConflicts, conflictDialogOpen]);

  if (loading && !negocio) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Cargando negocio...</p>
        </div>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div className="text-center py-12 w-full">
        <p className="text-gray-600 mb-4">Negocio no encontrado</p>
        <Button onClick={onVolver} variant="outline">Volver</Button>
      </div>
    );
  }

  const handleEliminarPresupuesto = async (presupuestoId: string): Promise<void> => {
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

  const handleCambiarEstadoPresupuesto = async (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string): Promise<void> => {
    await cambiarEstadoPresupuesto(negocioId, presupuestoId, nuevoEstado, fechaVencimiento);
  };

  const handleCambiarEstadoNegocio = async (negocioId: string, nuevoEstado: string) => {
    await cambiarEstadoNegocio(negocioId, nuevoEstado);
  };

  const handleResolveConflict = async (negocioId: string, resolvedState: string) => {
    await resolveConflict(negocioId, resolvedState);
    setCurrentConflict(null);
    setConflictDialogOpen(false);
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
          />
        </div>
      </main>

      {/* Conflict Resolution Dialog */}
      {currentConflict && (
        <ConflictResolutionDialog
          open={conflictDialogOpen}
          onOpenChange={setConflictDialogOpen}
          conflict={currentConflict}
          onResolve={handleResolveConflict}
        />
      )}
    </div>
  );
};

export default DetalleNegocio;
