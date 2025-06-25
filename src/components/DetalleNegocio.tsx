
import React, { useState, useEffect } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import { Loader2 } from 'lucide-react';
import CrearPresupuesto from './CrearPresupuesto';
import { useNavigate } from 'react-router-dom';
import BusinessDetailHeader from './negocio/BusinessDetailHeader';
import DetalleNegocioMainContent from './negocio/DetalleNegocioMainContent';
import ConflictResolutionDialog from './business/ConflictResolutionDialog';
import ManualSyncInterface from './business/ManualSyncInterface';
import SyncVerificationPanel from './business/SyncVerificationPanel';
import { Button } from '@/components/ui/button';
import { EstadoPresupuesto, EstadoNegocio } from '@/types';

interface DetalleNegocioProps {
  negocioId: string;
  onVolver: () => void;
}

const DetalleNegocio: React.FC<DetalleNegocioProps> = ({ negocioId, onVolver }) => {
  console.log('[DetalleNegocio] Rendering for negocioId:', negocioId);
  
  const { obtenerNegocio, eliminarPresupuesto, cambiarEstadoPresupuesto, cambiarEstadoNegocio, loading } = useNegocio();
  const { syncConflicts, resolveConflict } = useBidirectionalSync();
  const navigate = useNavigate();
  const [mostrarCrearPresupuesto, setMostrarCrearPresupuesto] = useState(false);
  const [presupuestoEditando, setPresupuestoEditando] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);

  const negocio = obtenerNegocio(negocioId);
  
  console.log('[DetalleNegocio] Negocio data:', {
    found: !!negocio,
    id: negocio?.id,
    numero: negocio?.numero,
    loading
  });

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

  const handleRefresh = () => {
    console.log('[DetalleNegocio] Refresh requested');
    // Trigger a refresh of the data
    window.location.reload();
  };

  if (loading && !negocio) {
    console.log('[DetalleNegocio] Loading state');
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
    console.log('[DetalleNegocio] Negocio not found');
    return (
      <div className="text-center py-12 w-full">
        <p className="text-gray-600 mb-4">Negocio no encontrado</p>
        <Button onClick={onVolver} variant="outline">Volver</Button>
      </div>
    );
  }

  const handleEliminarPresupuesto = async (presupuestoId: string): Promise<void> => {
    console.log('[DetalleNegocio] Eliminar presupuesto:', presupuestoId);
    await eliminarPresupuesto(negocioId, presupuestoId);
  };

  const handleVerPDF = (presupuestoId: string) => {
    console.log('[DetalleNegocio] Ver PDF:', presupuestoId);
    navigate(`/presupuesto/${negocioId}/${presupuestoId}/pdf`);
  };

  const handleEditarPresupuesto = (presupuestoId: string) => {
    console.log('[DetalleNegocio] Editar presupuesto:', presupuestoId);
    setPresupuestoEditando(presupuestoId);
    setMostrarCrearPresupuesto(true);
  };

  const handleCrearPresupuesto = () => {
    console.log('[DetalleNegocio] Crear presupuesto');
    setMostrarCrearPresupuesto(true);
  };

  const handleCerrarCrearPresupuesto = () => {
    console.log('[DetalleNegocio] Cerrar crear presupuesto');
    setMostrarCrearPresupuesto(false);
    setPresupuestoEditando(null);
  };

  const handleCambiarEstadoPresupuesto = async (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string): Promise<void> => {
    console.log('[DetalleNegocio] Cambiar estado presupuesto:', { presupuestoId, nuevoEstado, fechaVencimiento });
    await cambiarEstadoPresupuesto(negocioId, presupuestoId, nuevoEstado as EstadoPresupuesto, fechaVencimiento);
  };

  const handleCambiarEstadoNegocio = async (negocioId: string, nuevoEstado: string) => {
    console.log('[DetalleNegocio] Cambiar estado negocio:', { negocioId, nuevoEstado });
    await cambiarEstadoNegocio(negocioId, nuevoEstado as EstadoNegocio);
  };

  const handleResolveConflict = async (negocioId: string, resolvedState: string) => {
    console.log('[DetalleNegocio] Resolve conflict:', { negocioId, resolvedState });
    await resolveConflict(negocioId, resolvedState);
    setCurrentConflict(null);
    setConflictDialogOpen(false);
  };

  if (mostrarCrearPresupuesto) {
    console.log('[DetalleNegocio] Rendering CrearPresupuesto');
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

  console.log('[DetalleNegocio] Rendering main content');
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
          
          {/* Sync Tools Section - Temporarily simplified */}
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ Sync tools temporarily disabled for debugging navigation issues
              </p>
            </div>
          </div>
          
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
