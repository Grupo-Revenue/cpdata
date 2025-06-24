
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Calendar, FileText } from 'lucide-react';
import { Negocio, Presupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import PresupuestoTableActions from './PresupuestoTableActions';
import PresupuestoEstadoDialog from './PresupuestoEstadoDialog';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';

interface PresupuestosTableProps {
  negocio: Negocio;
  onCrearPresupuesto: () => void;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => Promise<void>;
  onVerPDF: (presupuestoId: string) => void;
  onCambiarEstado?: (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => Promise<void>;
}

const getEstadoBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'aprobado':
      return 'default';
    case 'enviado':
      return 'secondary';
    case 'rechazado':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getEstadoText = (estado: string) => {
  switch (estado) {
    case 'borrador':
      return 'Borrador';
    case 'enviado':
      return 'Enviado';
    case 'aprobado':
      return 'Aprobado';
    case 'rechazado':
      return 'Rechazado';
    case 'vencido':
      return 'Vencido';
    case 'cancelado':
      return 'Cancelado';
    default:
      return estado;
  }
};

const PresupuestosTable: React.FC<PresupuestosTableProps> = ({
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
  const valorTotal = calcularValorNegocio(negocio);
  const presupuestosAprobados = presupuestos.filter(p => p.estado === 'aprobado').length;
  const presupuestosEnviados = presupuestos.filter(p => p.estado === 'enviado').length;

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
    <TooltipProvider>
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Presupuestos ({presupuestos.length})
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                  <span>Total: {formatearPrecio(valorTotal)}</span>
                  {presupuestosAprobados > 0 && (
                    <span className="text-green-600">• {presupuestosAprobados} aprobados</span>
                  )}
                  {presupuestosEnviados > 0 && (
                    <span className="text-blue-600">• {presupuestosEnviados} enviados</span>
                  )}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={onCrearPresupuesto}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-9"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {presupuestos.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                No hay presupuestos
              </h3>
              <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                Crea tu primer presupuesto para comenzar a gestionar las propuestas de este negocio.
              </p>
              <Button 
                onClick={onCrearPresupuesto}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Presupuesto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700 w-[120px]">Nombre</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-[100px]">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-[120px] text-right">Valor</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-[100px]">Fecha</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-[120px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presupuestos.map((presupuesto) => (
                    <TableRow 
                      key={presupuesto.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-medium text-slate-800">
                        {presupuesto.nombre}
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant={getEstadoBadgeVariant(presupuesto.estado)}
                          className="font-medium"
                        >
                          {getEstadoText(presupuesto.estado)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right font-semibold text-slate-800">
                        {formatearPrecio(presupuesto.total)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(presupuesto.fechaCreacion).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          })}
                        </div>
                        {presupuesto.fechaVencimiento && (
                          <div className="text-xs text-slate-500 mt-1">
                            Vence: {new Date(presupuesto.fechaVencimiento).toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <PresupuestoTableActions
                          presupuesto={presupuesto}
                          onEditarPresupuesto={onEditarPresupuesto}
                          onEliminarPresupuesto={handleEliminarPresupuesto}
                          onVerPDF={onVerPDF}
                          onEnviarPresupuesto={handleEnviarPresupuesto}
                          onCambiarEstado={handleCambiarEstado}
                          eliminandoPresupuesto={eliminandoPresupuesto}
                          procesandoEstado={procesandoEstado}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
    </TooltipProvider>
  );
};

export default PresupuestosTable;
