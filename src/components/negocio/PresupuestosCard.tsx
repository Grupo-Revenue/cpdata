
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, Loader2, Send, Check, X, Clock, Calendar } from 'lucide-react';
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
      borrador: 'bg-gray-100 text-gray-800',
      enviado: 'bg-blue-100 text-blue-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
      vencido: 'bg-orange-100 text-orange-800',
      cancelado: 'bg-gray-100 text-gray-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Presupuestos ({presupuestos.length})</CardTitle>
            <Button onClick={onCrearPresupuesto} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Crear Presupuesto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {presupuestos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No hay presupuestos para este negocio</p>
              <Button onClick={onCrearPresupuesto} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Presupuesto
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {presupuestos.map((presupuesto) => (
                <div key={presupuesto.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-lg">{presupuesto.nombre}</h3>
                        <Badge className={obtenerBadgeEstadoPresupuesto(presupuesto.estado)}>
                          {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {presupuesto.productos.length} producto{presupuesto.productos.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatearPrecio(presupuesto.total)}
                      </p>
                      
                      {/* Fechas importantes */}
                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <p>Creado: {formatearFecha(presupuesto.fechaCreacion)}</p>
                        {presupuesto.fechaEnvio && (
                          <div className="flex items-center space-x-1">
                            <Send className="w-3 h-3" />
                            <span>Enviado: {formatearFecha(presupuesto.fechaEnvio)}</span>
                          </div>
                        )}
                        {presupuesto.fechaVencimiento && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Vence: {formatearFecha(presupuesto.fechaVencimiento)}</span>
                          </div>
                        )}
                        {presupuesto.fechaAprobacion && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Check className="w-3 h-3" />
                            <span>Aprobado: {formatearFecha(presupuesto.fechaAprobacion)}</span>
                          </div>
                        )}
                        {presupuesto.fechaRechazo && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <X className="w-3 h-3" />
                            <span>Rechazado: {formatearFecha(presupuesto.fechaRechazo)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
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
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        {(presupuesto.estado === 'borrador' || presupuesto.estado === 'enviado') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditarPresupuesto(presupuesto.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEliminarPresupuesto(presupuesto.id)}
                          className="text-red-600 hover:text-red-700"
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
                  <div className="mt-3 pt-3 border-t">
                    <div className="space-y-1">
                      {presupuesto.productos.map((producto) => (
                        <div key={producto.id} className="flex justify-between text-sm">
                          <span>{producto.nombre} (x{producto.cantidad})</span>
                          <span className="font-medium">{formatearPrecio(producto.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
