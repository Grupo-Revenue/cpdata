
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio, obtenerInfoPresupuestos } from '@/utils/businessCalculations';
import CompactPresupuestosList from './presupuestos/CompactPresupuestosList';
import PresupuestoEstadoDialog from './presupuestos/PresupuestoEstadoDialog';
import DetalleNegocioSecondaryInfo from './DetalleNegocioSecondaryInfo';

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

  // Enhanced status indicators with new states
  const getStatusBadges = () => {
    const badges = [];
    
    if (infoPresupuestos.presupuestosAprobados > 0) {
      badges.push(
        <Badge key="aprobados" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
          {infoPresupuestos.presupuestosAprobados} aprobado{infoPresupuestos.presupuestosAprobados !== 1 ? 's' : ''}
        </Badge>
      );
    }
    
    if (infoPresupuestos.presupuestosEnviados > 0) {
      badges.push(
        <Badge key="enviados" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
          {infoPresupuestos.presupuestosEnviados} enviado{infoPresupuestos.presupuestosEnviados !== 1 ? 's' : ''}
        </Badge>
      );
    }
    
    if (infoPresupuestos.presupuestosBorrador > 0) {
      badges.push(
        <Badge key="borrador" className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
          {infoPresupuestos.presupuestosBorrador} borrador{infoPresupuestos.presupuestosBorrador !== 1 ? 'es' : ''}
        </Badge>
      );
    }
    
    if (infoPresupuestos.presupuestosRechazados > 0) {
      badges.push(
        <Badge key="rechazados" className="bg-red-100 text-red-700 border-red-200 text-xs">
          {infoPresupuestos.presupuestosRechazados} rechazado{infoPresupuestos.presupuestosRechazados !== 1 ? 's' : ''}
        </Badge>
      );
    }
    
    if (infoPresupuestos.presupuestosVencidos > 0) {
      badges.push(
        <Badge key="vencidos" className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
          {infoPresupuestos.presupuestosVencidos} vencido{infoPresupuestos.presupuestosVencidos !== 1 ? 's' : ''}
        </Badge>
      );
    }

    return badges;
  };

  return (
    <>
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-6">
          {/* Business value and quick actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Valor Total</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatearPrecio(valorNegocio)}
                    </span>
                    {valorNegocio > 0 && (
                      <div className="flex items-center space-x-1 text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs font-medium">Activo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced status indicators */}
              {infoPresupuestos.totalPresupuestos > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {getStatusBadges()}
                </div>
              )}
            </div>

            <Button 
              onClick={onCrearPresupuesto} 
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Presupuesto
            </Button>
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
          <div className="mt-6 pt-4 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setMostrarInfoSecundaria(!mostrarInfoSecundaria)}
              className="w-full justify-between text-slate-600 hover:text-slate-700 hover:bg-slate-50"
            >
              <span className="text-sm font-medium">
                Información adicional ({negocio.contacto.nombre}, evento, empresas)
              </span>
              {mostrarInfoSecundaria ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
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
