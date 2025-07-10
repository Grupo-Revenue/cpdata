
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileText, Loader2, Send, Check, X } from 'lucide-react';
import { Presupuesto } from '@/types';

interface PresupuestoActionsProps {
  presupuesto: Presupuesto;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => void;
  onVerPDF: (presupuestoId: string) => void;
  onEnviarPresupuesto: (presupuestoId: string) => void;
  onCambiarEstado: (presupuestoId: string, nuevoEstado: string) => void;
  eliminandoPresupuesto: string | null;
  procesandoEstado: string | null;
}

const PresupuestoActions: React.FC<PresupuestoActionsProps> = ({
  presupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onEnviarPresupuesto,
  onCambiarEstado,
  eliminandoPresupuesto,
  procesandoEstado
}) => {
  const obtenerAccionesEstado = () => {
    const acciones = [];

    switch (presupuesto.estado) {
      case 'borrador':
        acciones.push(
          <Button
            key="enviar"
            variant="outline"
            size="sm"
            onClick={() => onEnviarPresupuesto(presupuesto.id)}
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
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

      case 'publicado':
        acciones.push(
          <Button
            key="aprobar"
            variant="outline"
            size="sm"
            onClick={() => onCambiarEstado(presupuesto.id, 'aprobado')}
            className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
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
            onClick={() => onCambiarEstado(presupuesto.id, 'rechazado')}
            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
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
    <div className="flex flex-col space-y-3 ml-6">
      {/* State action buttons */}
      <div className="flex space-x-2">
        {obtenerAccionesEstado()}
      </div>
      
      {/* Basic buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onVerPDF(presupuesto.id)}
          className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
        >
          <FileText className="w-4 h-4" />
        </Button>
        {(presupuesto.estado === 'borrador' || presupuesto.estado === 'publicado') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditarPresupuesto(presupuesto.id)}
            className="text-slate-600 hover:text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEliminarPresupuesto(presupuesto.id)}
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
  );
};

export default PresupuestoActions;
