
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Send, Check, X } from 'lucide-react';
import { Presupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PresupuestoActions from './PresupuestoActions';

interface PresupuestoItemProps {
  presupuesto: Presupuesto;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => void;
  onVerPDF: (presupuestoId: string) => void;
  onEnviarPresupuesto: (presupuestoId: string) => void;
  onCambiarEstado: (presupuestoId: string, nuevoEstado: string) => void;
  eliminandoPresupuesto: string | null;
  procesandoEstado: string | null;
}

const PresupuestoItem: React.FC<PresupuestoItemProps> = ({
  presupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onEnviarPresupuesto,
  onCambiarEstado,
  eliminandoPresupuesto,
  procesandoEstado
}) => {
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

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
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
          
          <PresupuestoActions
            presupuesto={presupuesto}
            onEditarPresupuesto={onEditarPresupuesto}
            onEliminarPresupuesto={onEliminarPresupuesto}
            onVerPDF={onVerPDF}
            onEnviarPresupuesto={onEnviarPresupuesto}
            onCambiarEstado={onCambiarEstado}
            eliminandoPresupuesto={eliminandoPresupuesto}
            procesandoEstado={procesandoEstado}
          />
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
  );
};

export default PresupuestoItem;
