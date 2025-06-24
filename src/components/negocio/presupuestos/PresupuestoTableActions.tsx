
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, FileText, Loader2, Send, Check, X } from 'lucide-react';
import { Presupuesto } from '@/types';

interface PresupuestoTableActionsProps {
  presupuesto: Presupuesto;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => void;
  onVerPDF: (presupuestoId: string) => void;
  onEnviarPresupuesto: (presupuestoId: string) => void;
  onCambiarEstado: (presupuestoId: string, nuevoEstado: string) => void;
  eliminandoPresupuesto: string | null;
  procesandoEstado: string | null;
}

const PresupuestoTableActions: React.FC<PresupuestoTableActionsProps> = ({
  presupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onEnviarPresupuesto,
  onCambiarEstado,
  eliminandoPresupuesto,
  procesandoEstado
}) => {
  const isProcessing = procesandoEstado === presupuesto.id;
  const isDeleting = eliminandoPresupuesto === presupuesto.id;

  const getStateActions = () => {
    const actions = [];

    switch (presupuesto.estado) {
      case 'borrador':
        actions.push(
          <Tooltip key="send">
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEnviarPresupuesto(presupuesto.id)}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enviar presupuesto</p>
            </TooltipContent>
          </Tooltip>
        );
        break;

      case 'enviado':
        actions.push(
          <Tooltip key="approve">
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCambiarEstado(presupuesto.id, 'aprobado')}
                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aprobar presupuesto</p>
            </TooltipContent>
          </Tooltip>,
          <Tooltip key="reject">
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCambiarEstado(presupuesto.id, 'rechazado')}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Rechazar presupuesto</p>
            </TooltipContent>
          </Tooltip>
        );
        break;
    }

    return actions;
  };

  return (
    <div className="flex items-center justify-center space-x-1">
      {/* State-specific actions */}
      {getStateActions()}
      
      {/* Always available actions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVerPDF(presupuesto.id)}
            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            <FileText className="w-3 h-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ver PDF</p>
        </TooltipContent>
      </Tooltip>

      {/* Edit - only for draft and sent budgets */}
      {(presupuesto.estado === 'borrador' || presupuesto.estado === 'enviado') && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditarPresupuesto(presupuesto.id)}
              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              <Edit className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar presupuesto</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Delete */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEliminarPresupuesto(presupuesto.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Eliminar presupuesto</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default PresupuestoTableActions;
