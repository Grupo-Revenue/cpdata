import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Calendar, FileText } from 'lucide-react';
import { Negocio, Presupuesto } from '@/types';
import { formatearPrecio, formatearFechaSinZonaHoraria } from '@/utils/formatters';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import { getQuoteStatusColors, getQuoteStatusText } from '@/utils/quoteCalculations';
import PresupuestoTableActions from './PresupuestoTableActions';
import PresupuestoEstadoDialog from './PresupuestoEstadoDialog';

interface PresupuestosTableProps {
  negocio: Negocio;
  onCrearPresupuesto: () => void;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => Promise<void>;
  onVerPDF: (presupuestoId: string) => void;
  onCambiarEstado?: (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => Promise<void>;
  onRefresh: () => void;
}

const PresupuestosTable: React.FC<PresupuestosTableProps> = ({
  negocio,
  onCrearPresupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onCambiarEstado,
  onRefresh
}) => {
  
  const [eliminandoPresupuesto, setEliminandoPresupuesto] = useState<string | null>(null);
  const [mostrarDialogoEnvio, setMostrarDialogoEnvio] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<string | null>(null);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [procesandoEstado, setProcesandoEstado] = useState<string | null>(null);

  const presupuestos = negocio.presupuestos;
  const valorTotal = calcularValorNegocio(negocio);
  const presupuestosAprobados = presupuestos.filter(p => p.estado === 'aprobado').length;
  const presupuestosPublicados = presupuestos.filter(p => p.estado === 'publicado').length;

  // Helper function to format product summary
  const formatProductSummary = (presupuesto: Presupuesto): string => {
    if (!presupuesto.productos || presupuesto.productos.length === 0) {
      return 'Sin productos';
    }
    
    return presupuesto.productos
      .map(producto => `${producto.nombre} (${producto.cantidad})`)
      .join(', ');
  };

  const handleEliminarPresupuesto = async (presupuestoId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este presupuesto?')) {
      setEliminandoPresupuesto(presupuestoId);
      try {
        await onEliminarPresupuesto(presupuestoId);
        // No need to refresh - the state is updated optimistically in NegocioContext
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
      await onCambiarEstado(presupuestoSeleccionado, 'publicado', fechaVencimiento);
      
      setMostrarDialogoEnvio(false);
      setPresupuestoSeleccionado(null);
      setFechaVencimiento('');
      onRefresh();
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
      await onCambiarEstado(presupuestoId, nuevoEstado);
      
      onRefresh();
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
                  {presupuestosPublicados > 0 && (
                    <span className="text-blue-600">• {presupuestosPublicados} publicados</span>
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
                    <TableHead className="font-semibold text-slate-700 min-w-[200px]">Productos</TableHead>
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
                        {presupuesto.facturado && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-700">
                            Facturado
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm text-slate-600 cursor-help leading-snug py-1">
                              {formatProductSummary(presupuesto)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-md">
                            <p className="text-sm whitespace-pre-wrap">{formatProductSummary(presupuesto)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          className={`font-medium ${getQuoteStatusColors(presupuesto.estado)}`}
                        >
                          {getQuoteStatusText(presupuesto.estado)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right font-semibold text-slate-800">
                        {formatearPrecio(presupuesto.total)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatearFechaSinZonaHoraria(presupuesto.fechaCreacion).split('/').slice(0, 2).join('/') + '/' + formatearFechaSinZonaHoraria(presupuesto.fechaCreacion).split('/')[2].slice(-2)}
                        </div>
                        {presupuesto.fechaVencimiento && (
                          <div className="text-xs text-slate-500 mt-1">
                            Vence: {formatearFechaSinZonaHoraria(presupuesto.fechaVencimiento).split('/').slice(0, 2).join('/')}
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
                          negocioId={negocio.id}
                          onRefresh={onRefresh}
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
