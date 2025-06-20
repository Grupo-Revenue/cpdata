
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
            onClick={() => onCambiarEstado(presupuesto.id, 'aprobado')}
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
            onClick={() => onCambiarEstado(presupuesto.id, 'rechazado')}
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
    <div className="flex flex-col space-y-2 ml-6">
      {/* Botones de acción del estado */}
      <div className="flex space-x-2">
        {obtenerAccionesEstado()}
      </div>
      
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
