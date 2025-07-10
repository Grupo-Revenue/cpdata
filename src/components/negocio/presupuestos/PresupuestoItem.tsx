
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
      borrador: 'bg-slate-100 text-slate-700 border-slate-200',
      publicado: 'bg-blue-100 text-blue-700 border-blue-200',
      aprobado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rechazado: 'bg-red-100 text-red-700 border-red-200',
      vencido: 'bg-orange-100 text-orange-700 border-orange-200',
      cancelado: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colores[estado as keyof typeof colores] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-slate-200 border-l-4 border-l-slate-900">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <h3 className="text-xl font-bold text-slate-900">{presupuesto.nombre}</h3>
              <Badge 
                variant="outline"
                className={`${obtenerBadgeEstadoPresupuesto(presupuesto.estado)} border font-medium`}
              >
                {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-8 mb-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatearPrecio(presupuesto.total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Productos</p>
                <p className="text-lg font-semibold text-slate-900">
                  {presupuesto.productos.length} ítem{presupuesto.productos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Important dates */}
            <div className="flex flex-wrap gap-6 text-sm text-slate-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Creado: {formatearFecha(presupuesto.fechaCreacion)}</span>
              </div>
              {presupuesto.fechaEnvio && (
                <div className="flex items-center text-blue-600">
                  <Send className="w-4 h-4 mr-2" />
                  <span>Publicado: {formatearFecha(presupuesto.fechaEnvio)}</span>
                </div>
              )}
              {presupuesto.fechaVencimiento && (
                <div className="flex items-center text-orange-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Vence: {formatearFecha(presupuesto.fechaVencimiento)}</span>
                </div>
              )}
              {presupuesto.fechaAprobacion && (
                <div className="flex items-center text-emerald-600">
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
        
        {/* Products list */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Productos incluidos:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {presupuesto.productos.map((producto) => (
              <div key={producto.id} className="flex justify-between items-center text-sm bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                <span className="text-slate-700 font-medium">{producto.nombre} (x{producto.cantidad})</span>
                <span className="font-semibold text-slate-900">{formatearPrecio(producto.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PresupuestoItem;
