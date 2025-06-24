
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Negocio } from '@/types';
import PresupuestosCardHeader from './presupuestos/PresupuestosCardHeader';
import EmptyPresupuestosState from './presupuestos/EmptyPresupuestosState';
import PresupuestoItem from './presupuestos/PresupuestoItem';
import PresupuestoEstadoDialog from './presupuestos/PresupuestoEstadoDialog';
import PresupuestosResumen from './PresupuestosResumen';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';

interface PresupuestosCardProps {
  negocio: Negocio;
  onCrearPresupuesto: () => void;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => Promise<void>;
  onVerPDF: (presupuestoId: string) => void;
  onCambiarEstado?: (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => Promise<void>;
}

const PresupuestosCard: React.FC<PresupuestosCardProps> = ({
  negocio,
  onCrearPresupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onCambiarEstado
}) => {
  const { syncOnBudgetUpdate } = useBidirectionalSync();
  const [eliminandoPresupuesto, setEliminandoPresupuesto] = useState<string | null>(null);
  const [mostrarDialogoEnvio, setMostrarDialogoEnvio] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<string | null>(null);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [procesandoEstado, setProcesandoEstado] = useState<string | null>(null);

  const presupuestos = negocio.presupuestos;

  const handleEliminarPresupuesto = async (presupuestoId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este presupuesto?')) {
      setEliminandoPresupuesto(presupuestoId);
      try {
        console.log('Deleting budget and triggering amount sync for business:', negocio.id);
        await onEliminarPresupuesto(presupuestoId);
        
        // Trigger amount sync after budget deletion with a small delay
        setTimeout(async () => {
          await syncOnBudgetUpdate(negocio.id);
        }, 1000);
      } catch (error) {
        console.error('Error eliminando presupuesto:', error);
      } finally {
        setEliminandoPresupuesto(null);
      }
    }
  };

  const handleEnviarPresupuesto = (presupuestoId: string) => {
    setPresupuestoSeleccionado(presupuestoId);
    setMostrarDialogoEnvio(true);
    // Set default due date (30 days)
    const fechaDefault = new Date();
    fechaDefault.setDate(fechaDefault.getDate() + 30);
    setFechaVencimiento(fechaDefault.toISOString().split('T')[0]);
  };

  const confirmarEnvio = async () => {
    if (!presupuestoSeleccionado || !onCambiarEstado) return;

    setProcesandoEstado(presupuestoSeleccionado);
    try {
      console.log('Sending budget and triggering sync for business:', negocio.id);
      await onCambiarEstado(presupuestoSeleccionado, 'enviado', fechaVencimiento);
      
      // Trigger amount sync after state change with a small delay
      setTimeout(async () => {
        await syncOnBudgetUpdate(negocio.id);
      }, 1000);
      
      setMostrarDialogoEnvio(false);
      setPresupuestoSeleccionado(null);
      setFechaVencimiento('');
    } catch (error) {
      console.error('Error enviando presupuesto:', error);
    } finally {
      setProcesandoEstado(null);
    }
  };

  const handleCambiarEstado = async (presupuestoId: string, nuevoEstado: string) => {
    if (!onCambiarEstado) return;

    setProcesandoEstado(presupuestoId);
    try {
      console.log('Changing budget state and triggering sync for business:', negocio.id, 'New state:', nuevoEstado);
      await onCambiarEstado(presupuestoId, nuevoEstado);
      
      // Trigger amount sync after state change with a small delay
      setTimeout(async () => {
        await syncOnBudgetUpdate(negocio.id);
      }, 1000);
    } catch (error) {
      console.error('Error cambiando estado:', error);
    } finally {
      setProcesandoEstado(null);
    }
  };

  return (
    <>
      <Card className="border-slate-200 bg-white">
        <PresupuestosCardHeader 
          negocio={negocio} 
          onCrearPresupuesto={onCrearPresupuesto} 
        />
        
        <CardContent className="p-6 pt-0">
          {presupuestos.length === 0 ? (
            <EmptyPresupuestosState onCrearPresupuesto={onCrearPresupuesto} />
          ) : (
            <>
              <PresupuestosResumen presupuestos={presupuestos} />
              
              <div className="space-y-4">
                {presupuestos.map((presupuesto) => (
                  <PresupuestoItem
                    key={presupuesto.id}
                    presupuesto={presupuesto}
                    onEditarPresupuesto={onEditarPresupuesto}
                    onEliminarPresupuesto={handleEliminarPresupuesto}
                    onVerPDF={onVerPDF}
                    onEnviarPresupuesto={handleEnviarPresupuesto}
                    onCambiarEstado={handleCambiarEstado}
                    eliminandoPresupuesto={eliminandoPresupuesto}
                    procesandoEstado={procesandoEstado}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PresupuestoEstadoDialog
        open={mostrarDialogoEnvio}
        onOpenChange={setMostrarDialogoEnvio}
        fechaVencimiento={fechaVencimiento}
        onFechaVencimientoChange={setFechaVencimiento}
        onConfirmar={confirmarEnvio}
        procesando={procesandoEstado !== null}
      />
    </>
  );
};

export default PresupuestosCard;
