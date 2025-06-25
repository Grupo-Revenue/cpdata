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
import { EstadoPresupuesto, EstadoNegocio } from '@/types';

interface DetalleNegocioProps {
  negocioId: string;
  onVolver: () => void;
}

const DetalleNegocio: React.FC<DetalleNegocioProps> = ({ negocioId, onVolver }) => {
  console.log('[DetalleNegocio] ==> COMPONENT RENDERING <==');
  console.log('[DetalleNegocio] Received negocioId:', negocioId);
  console.log('[DetalleNegocio] negocioId type:', typeof negocioId);
  console.log('[DetalleNegocio] negocioId length:', negocioId?.length);
  
  const { obtenerNegocio, eliminarPresupuesto, cambiarEstadoPresupuesto, cambiarEstadoNegocio, loading, negocios } = useNegocio();
  const { syncConflicts, resolveConflict } = useBidirectionalSync();
  const navigate = useNavigate();
  const [mostrarCrearPresupuesto, setMostrarCrearPresupuesto] = useState(false);
  const [presupuestoEditando, setPresupuestoEditando] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);

  // Debug: Log all available negocios for comparison
  useEffect(() => {
    console.log('[DetalleNegocio] Debug - All available negocios:');
    negocios.forEach((negocio, index) => {
      console.log(`[DetalleNegocio] Negocio ${index}:`, {
        id: negocio.id,
        numero: negocio.numero,
        contacto: negocio.contacto?.nombre,
        evento: negocio.evento?.nombreEvento
      });
    });
    console.log('[DetalleNegocio] Looking for negocioId:', negocioId);
  }, [negocios, negocioId]);

  const negocio = obtenerNegocio(negocioId);
  
  console.log('[DetalleNegocio] obtenerNegocio result:', {
    found: !!negocio,
    negocioId: negocioId,
    searchResult: negocio ? {
      id: negocio.id,
      numero: negocio.numero,
      contacto: negocio.contacto?.nombre
    } : 'NOT FOUND'
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
    console.log('[DetalleNegocio] ==> SHOWING LOADING STATE <==');
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Cargando negocio...</p>
          <p className="text-sm text-gray-500 mt-2">ID: {negocioId}</p>
        </div>
      </div>
    );
  }

  if (!negocio) {
    console.log('[DetalleNegocio] ==> NEGOCIO NOT FOUND <==');
    console.error('[DetalleNegocio] ERROR: Negocio not found for ID:', negocioId);
    console.log('[DetalleNegocio] Available negocio IDs:', negocios.map(n => n.id));
    
    return (
      <div className="text-center py-12 w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Negocio no encontrado</h3>
          <p className="text-red-600 mb-4">
            No se pudo encontrar el negocio con ID: <code className="bg-red-100 px-1 rounded">{negocioId}</code>
          </p>
          <p className="text-sm text-red-500 mb-4">
            Total de negocios disponibles: {negocios.length}
          </p>
          <Button onClick={onVolver} variant="outline">Volver al Dashboard</Button>
        </div>
      </div>
    );
  }

  console.log('[DetalleNegocio] ==> NEGOCIO FOUND - RENDERING CONTENT <==');
  console.log('[DetalleNegocio] Negocio data:', {
    id: negocio.id,
    numero: negocio.numero,
    contacto: negocio.contacto?.nombre,
    evento: negocio.evento?.nombreEvento,
    presupuestosCount: negocio.presupuestos?.length || 0
  });

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
    console.log('[DetalleNegocio] ==> RENDERING CrearPresupuesto <==');
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

  console.log('[DetalleNegocio] ==> RENDERING MAIN CONTENT <==');
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
          
          {/* Debug Panel - Temporary */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🔧 Debug Info</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Negocio ID:</strong> {negocio.id}</p>
              <p><strong>Número:</strong> #{negocio.numero}</p>
              <p><strong>Contacto:</strong> {negocio.contacto?.nombre} {negocio.contacto?.apellido}</p>
              <p><strong>Evento:</strong> {negocio.evento?.nombreEvento}</p>
              <p><strong>Presupuestos:</strong> {negocio.presupuestos?.length || 0}</p>
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
