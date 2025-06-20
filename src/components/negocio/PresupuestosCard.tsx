import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, Loader2, Send, Check, X, Calendar } from 'lucide-react';
import { Presupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PresupuestosResumen from './PresupuestosResumen';

interface PresupuestosCardProps {
  presupuestos: Presupuesto[];
  onCrearPresupuesto: () => void;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => Promise<void>;
  onVerPDF: (presupuestoId: string) => void;
  onCambiarEstado?: (presupuestoId: string, nuevoEstado: string, fechaVencimiento?: string) => Promise<void>;
}

const PresupuestosCard: React.FC<PresupuestosCardProps> = ({
  presupuestos,
  onCrearPresupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onCambiarEstado
}) => {
  const [eliminandoPresupuesto, setEliminandoPresupuesto] = useState<string | null>(null);
  const [mostrarDialogoEnvio, setMostrarDialogoEnvio] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<string | null>(null);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [procesandoEstado, setProcesandoEstado] = useState<string | null>(null);

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  const obtenerBadgeEstadoPresupuesto = (estado: string) => {
    const colores = {
      borrador: 'bg-gray-100 text-gray-800 border-gray-200',
      enviado: 'bg-blue-100 text-blue-800 border-blue-200',
      aprobado: 'bg-green-100 text-green-800 border-green-200',
      rechazado: 'bg-red-100 text-red-800 border-red-200',
      vencido: 'bg-orange-100 text-orange-800 border-orange-200',
      cancelado: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleEliminarPresupuesto = async (presupuestoId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este presupuesto?')) {
      setEliminandoPresupuesto(presupuestoId);
      try {
        await onEliminarPresupuesto(presupuestoId);
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
    // Establecer fecha de vencimiento por defecto (30 días)
    const fechaDefault = new Date();
    fechaDefault.setDate(fechaDefault.getDate() + 30);
    setFechaVencimiento(fechaDefault.toISOString().split('T')[0]);
  };

  const confirmarEnvio = async () => {
    if (!presupuestoSeleccionado || !onCambiarEstado) return;

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
    if (!onCambiarEstado) return;

    setProcesandoEstado(presupuestoId);
    try {
      await onCambiarEstado(presupuestoId, nuevoEstado);
    } catch (error) {
      console.error('Error cambiando estado:', error);
    } finally {
      setProcesandoEstado(null);
    }
  };

  const obtenerAccionesPresupuesto = (presupuesto: Presupuesto) => {
    const acciones = [];

    switch (presupuesto.estado) {
      case 'borrador':
        acciones.push(
          <Button
            key="enviar"
            variant="outline"
            size="sm"
            onClick={() => handleEnviarPresupuesto(presupuesto.id)}
            className="text-blue-600 hover:text-blue-700"
            disabled={procesandoEstado === presupuesto.id}
          >
            {procesandoEstado === presupuesto.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        );
        break;

      case 'enviado':
        acciones.push(
          <Button
            key="aprobar"
            variant="outline"
            size="sm"
            onClick={() => handleCambiarEstado(presupuesto.id, 'aprobado')}
            className="text-green-600 hover:text-green-700"
            disabled={procesandoEstado === presupuesto.id}
          >
            {procesandoEstado === presupuesto.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </Button>,
          <Button
            key="rechazar"
            variant="outline"
            size="sm"
            onClick={() => handleCambiarEstado(presupuesto.id, 'rechazado')}
            className="text-red-600 hover:text-red-700"
            disabled={procesandoEstado === presupuesto.id}
          >
            {procesandoEstado === presupuesto.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </Button>
        );
        break;
    }

    return acciones;
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Presupuestos del Negocio</CardTitle>
            <Button 
              onClick={onCrearPresupuesto} 
              variant="secondary"
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {presupuestos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay presupuestos</h3>
              <p className="text-gray-600 mb-6">Comienza creando el primer presupuesto para este negocio</p>
              <Button 
                onClick={onCrearPresupuesto} 
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Primer Presupuesto
              </Button>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <PresupuestosResumen presupuestos={presupuestos} />
              
              {/* Presupuestos list */}
              <div className="space-y-4">
                {presupuestos.map((presupuesto) => (
                  <Card key={presupuesto.id} className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900">{presupuesto.nombre}</h3>
                            <Badge className={`${obtenerBadgeEstadoPresupuesto(presupuesto.estado)} border`}>
                              {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-6 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Valor Total</p>
                              <p className="text-2xl font-bold text-indigo-600">
                                {formatearPrecio(presupuesto.total)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Productos</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {presupuesto.productos.length} ítem{presupuesto.productos.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          
                          {/* Fechas importantes */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>Creado: {formatearFecha(presupuesto.fechaCreacion)}</span>
                            </div>
                            {presupuesto.fechaEnvio && (
                              <div className="flex items-center text-blue-600">
                                <Send className="w-4 h-4 mr-2" />
                                <span>Enviado: {formatearFecha(presupuesto.fechaEnvio)}</span>
                              </div>
                            )}
                            {presupuesto.fechaVencimiento && (
                              <div className="flex items-center text-orange-600">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>Vence: {formatearFecha(presupuesto.fechaVencimiento)}</span>
                              </div>
                            )}
                            {presupuesto.fechaAprobacion && (
                              <div className="flex items-center text-green-600">
                                <Check className="w-4 h-4 mr-2" />
                                <span>Aprobado: {formatearFecha(presupuesto.fechaAprobacion)}</span>
                              </div>
                            )}
                            {presupuesto.fechaRechazo && (
                              <div className="flex items-center text-red-600">
                                <X className="w-4 h-4 mr-2" />
                                <span>Rechazado: {formatearFecha(presupuesto.fechaRechazo)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-6">
                          {/* Botones de acción del estado */}
                          {onCambiarEstado && (
                            <div className="flex space-x-2">
                              {obtenerAccionesPresupuesto(presupuesto)}
                            </div>
                          )}
                          
                          {/* Botones básicos */}
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onVerPDF(presupuesto.id)}
                              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            {(presupuesto.estado === 'borrador' || presupuesto.estado === 'enviado') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditarPresupuesto(presupuesto.id)}
                                className="text-indigo-600 hover:text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEliminarPresupuesto(presupuesto.id)}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                              disabled={eliminandoPresupuesto === presupuesto.id}
                            >
                              {eliminandoPresupuesto === presupuesto.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Lista de productos */}
                      <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Productos incluidos:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {presupuesto.productos.map((producto) => (
                            <div key={producto.id} className="flex justify-between items-center text-sm bg-white rounded px-3 py-2">
                              <span className="text-gray-700">{producto.nombre} (x{producto.cantidad})</span>
                              <span className="font-medium text-gray-900">{formatearPrecio(producto.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para enviar presupuesto */}
      <Dialog open={mostrarDialogoEnvio} onOpenChange={setMostrarDialogoEnvio}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Presupuesto</DialogTitle>
            <DialogDescription>
              Establezca la fecha de vencimiento para este presupuesto. Después de esta fecha, 
              el presupuesto será marcado automáticamente como vencido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogoEnvio(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmarEnvio}
              disabled={!fechaVencimiento || procesandoEstado !== null}
            >
              {procesandoEstado ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                'Enviar Presupuesto'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PresupuestosCard;
