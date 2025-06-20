
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Negocio } from '@/types';
import { calcularValorNegocio, obtenerInfoPresupuestos } from '@/utils/businessCalculations';
import CompactPresupuestosList from './presupuestos/CompactPresupuestosList';
import PresupuestoEstadoDialog from './presupuestos/PresupuestoEstadoDialog';
import DetalleNegocioSecondaryInfo from './DetalleNegocioSecondaryInfo';
import BusinessValueSection from './sections/BusinessValueSection';
import StatusIndicators from './sections/StatusIndicators';
import QuickActionsSection from './sections/QuickActionsSection';
import SecondaryInfoToggle from './sections/SecondaryInfoToggle';

interface DetalleNegocioMainContentProps {
  negocio: Negocio;
  onCrearPresupuesto: () => void;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => Promise<void>;
  onVerPDF: (presupuestoId: string) => void;
  onCambiarEstado: (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => Promise<void>;
}

const DetalleNegocioMainContent: React.FC<DetalleNegocioMainContentProps> = ({
  negocio,
  onCrearPresupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onCambiarEstado
}) => {
  const [mostrarInfoSecundaria, setMostrarInfoSecundaria] = useState(false);
  const [mostrarDialogoEnvio, setMostrarDialogoEnvio] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<string | null>(null);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [procesandoEstado, setProcesandoEstado] = useState<string | null>(null);

  const valorNegocio = calcularValorNegocio(negocio);
  const infoPresupuestos = obtenerInfoPresupuestos(negocio);

  const handleEnviarPresupuesto = (presupuestoId: string) => {
    setPresupuestoSeleccionado(presupuestoId);
    setMostrarDialogoEnvio(true);
    const fechaDefault = new Date();
    fechaDefault.setDate(fechaDefault.getDate() + 30);
    setFechaVencimiento(fechaDefault.toISOString().split('T')[0]);
  };

  const confirmarEnvio = async () => {
    if (!presupuestoSeleccionado) return;

    setProcesandoEstado(presupuestoSeleccionado);
    try {
      await onCambiarEstado(presupuestoSeleccionado, 'enviado', fechaVencimiento);
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
    setProcesandoEstado(presupuestoId);
    try {
      await onCambiarEstado(presupuestoId, nuevoEstado);
    } catch (error) {
      console.error('Error cambiando estado:', error);
    } finally {
      setProcesandoEstado(null);
    }
  };

  return (
    <>
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-6">
          {/* Business value and quick actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <BusinessValueSection valorNegocio={valorNegocio} />

              <StatusIndicators
                presupuestosAprobados={infoPresupuestos.presupuestosAprobados}
                presupuestosEnviados={infoPresupuestos.presupuestosEnviados}
                presupuestosBorrador={infoPresupuestos.presupuestosBorrador}
                presupuestosRechazados={infoPresupuestos.presupuestosRechazados}
                presupuestosVencidos={infoPresupuestos.presupuestosVencidos}
                totalPresupuestos={infoPresupuestos.totalPresupuestos}
              />
            </div>

            <QuickActionsSection onCrearPresupuesto={onCrearPresupuesto} />
          </div>

          {/* Compact budgets list */}
          <CompactPresupuestosList
            presupuestos={negocio.presupuestos}
            onCrearPresupuesto={onCrearPresupuesto}
            onEditarPresupuesto={onEditarPresupuesto}
            onEliminarPresupuesto={onEliminarPresupuesto}
            onVerPDF={onVerPDF}
            onEnviarPresupuesto={handleEnviarPresupuesto}
            onCambiarEstado={handleCambiarEstado}
            procesandoEstado={procesandoEstado}
          />

          {/* Secondary information toggle */}
          <SecondaryInfoToggle
            mostrarInfoSecundaria={mostrarInfoSecundaria}
            onToggle={() => setMostrarInfoSecundaria(!mostrarInfoSecundaria)}
            nombreContacto={negocio.contacto.nombre}
          />
        </CardContent>
      </Card>

      {/* Secondary information (collapsible) */}
      {mostrarInfoSecundaria && (
        <DetalleNegocioSecondaryInfo
          contacto={negocio.contacto}
          productora={negocio.productora}
          clienteFinal={negocio.clienteFinal}
          evento={negocio.evento}
        />
      )}

      {/* Dialog for sending budget */}
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

export default DetalleNegocioMainContent;
