import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Edit, Trash2, FileText, Send, Check, X, Loader2 } from 'lucide-react';
import { Presupuesto } from '@/types';
import { formatearPrecio, formatearFechaSinZonaHoraria } from '@/utils/formatters';
import { getQuoteStatusColors, getQuoteStatusText } from '@/utils/quoteCalculations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import EmptyPresupuestosState from './EmptyPresupuestosState';

interface CompactPresupuestosListProps {
  presupuestos: Presupuesto[];
  onCrearPresupuesto: () => void;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => Promise<void>;
  onVerPDF: (presupuestoId: string) => void;
  onEnviarPresupuesto: (presupuestoId: string) => void;
  onCambiarEstado: (presupuestoId: string, nuevoEstado: string) => void;
  procesandoEstado: string | null;
}

const CompactPresupuestosList: React.FC<CompactPresupuestosListProps> = ({
  presupuestos,
  onCrearPresupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onEnviarPresupuesto,
  onCambiarEstado,
  procesandoEstado
}) => {
  const [eliminandoPresupuesto, setEliminandoPresupuesto] = useState<string | null>(null);

  const formatearFecha = (fecha: string) => {
    return formatearFechaSinZonaHoraria(fecha);
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

  const obtenerAccionesEstado = (presupuesto: Presupuesto) => {
    const acciones = [];

    switch (presupuesto.estado) {
      case 'borrador':
        acciones.push(
          <Button
            key="enviar"
            variant="outline"
            size="sm"
            onClick={() => onEnviarPresupuesto(presupuesto.id)}
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 h-7 px-2"
            disabled={procesandoEstado === presupuesto.id}
          >
            {procesandoEstado === presupuesto.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </Button>
        );
        break;

      case 'publicado':
        acciones.push(
          <Button
            key="aprobar"
            variant="outline"
            size="sm"
            onClick={() => onCambiarEstado(presupuesto.id, 'aprobado')}
            className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-7 px-2"
            disabled={procesandoEstado === presupuesto.id}
          >
            {procesandoEstado === presupuesto.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </Button>,
          <Button
            key="rechazar"
            variant="outline"
            size="sm"
            onClick={() => onCambiarEstado(presupuesto.id, 'rechazado')}
            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 h-7 px-2"
            disabled={procesandoEstado === presupuesto.id}
          >
            {procesandoEstado === presupuesto.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <X className="w-3 h-3" />
            )}
          </Button>
        );
        break;
    }

    return acciones;
  };

  if (presupuestos.length === 0) {
    return <EmptyPresupuestosState onCrearPresupuesto={onCrearPresupuesto} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Presupuestos ({presupuestos.length})
        </h3>
      </div>

      {presupuestos.map((presupuesto) => (
        <div 
          key={presupuesto.id} 
          className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-white transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h4 className="font-semibold text-slate-900">{presupuesto.nombre}</h4>
                <Badge 
                  variant="outline"
                  className={`${getQuoteStatusColors(presupuesto.estado)} border text-xs`}
                >
                  {getQuoteStatusText(presupuesto.estado)}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-slate-600">
                <div className="flex items-center space-x-1 font-semibold text-slate-900">
                  <span>{formatearPrecio(presupuesto.total)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{presupuesto.productos.length} producto{presupuesto.productos.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Creado: {formatearFecha(presupuesto.fechaCreacion)}</span>
                </div>
                {presupuesto.fechaEnvio && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Send className="w-3 h-3" />
                    <span>Publicado: {formatearFecha(presupuesto.fechaEnvio)}</span>
                  </div>
                )}
                {presupuesto.fechaVencimiento && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <Calendar className="w-3 h-3" />
                    <span>Vence: {formatearFecha(presupuesto.fechaVencimiento)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {/* State action buttons */}
              {obtenerAccionesEstado(presupuesto)}
              
              {/* Basic action buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerPDF(presupuesto.id)}
                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 h-7 px-2"
              >
                <FileText className="w-3 h-3" />
              </Button>
              {(presupuesto.estado === 'borrador' || presupuesto.estado === 'publicado') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditarPresupuesto(presupuesto.id)}
                  className="text-slate-600 hover:text-slate-700 border-slate-200 hover:bg-slate-50 h-7 px-2"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEliminarPresupuesto(presupuesto.id)}
                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 h-7 px-2"
                disabled={eliminandoPresupuesto === presupuesto.id}
              >
                {eliminandoPresupuesto === presupuesto.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompactPresupuestosList;
