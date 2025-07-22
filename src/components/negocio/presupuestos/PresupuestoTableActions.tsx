
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Send, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { Presupuesto } from '@/types';
import { usePresupuestoActions } from '@/hooks/usePresupuestoActions';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

interface PresupuestoTableActionsProps {
  presupuesto: Presupuesto;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => void;
  onVerPDF: (presupuestoId: string) => void;
  onEnviarPresupuesto?: (presupuestoId: string) => void;
  onCambiarEstado?: (presupuestoId: string, nuevoEstado: string) => void;
  eliminandoPresupuesto: string | null;
  procesandoEstado: string | null;
  negocioId: string;
  onRefresh: () => void;
}

const PresupuestoTableActions: React.FC<PresupuestoTableActionsProps> = ({
  presupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF,
  onEnviarPresupuesto,
  onCambiarEstado,
  eliminandoPresupuesto,
  procesandoEstado,
  negocioId,
  onRefresh
}) => {
  const { marcarComoFacturado, loading: facturandoPresupuesto } = usePresupuestoActions(negocioId, onRefresh);
  const { hasPermission, isAuthenticated } = usePermissions();
  const isProcessing = eliminandoPresupuesto === presupuesto.id || procesandoEstado === presupuesto.id || facturandoPresupuesto;

  const canEdit = presupuesto.estado === 'borrador' && isAuthenticated;
  const canSend = presupuesto.estado === 'borrador' && onEnviarPresupuesto && isAuthenticated;
  const canApprove = presupuesto.estado === 'publicado' && onCambiarEstado && isAuthenticated;
  const canReject = ['publicado', 'aprobado'].includes(presupuesto.estado) && onCambiarEstado && isAuthenticated;
  const canMarkAsInvoiced = presupuesto.estado === 'aprobado' && !presupuesto.facturado && isAuthenticated;
  const canDelete = isAuthenticated;

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isProcessing}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onVerPDF(presupuesto.id)}>
            <FileText className="h-4 w-4 mr-2" />
            Ver PDF
          </DropdownMenuItem>
          
          {canEdit && (
            <DropdownMenuItem onClick={() => onEditarPresupuesto(presupuesto.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          )}
          
          {canSend && (
            <DropdownMenuItem onClick={() => onEnviarPresupuesto(presupuesto.id)}>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </DropdownMenuItem>
          )}
          
          {canApprove && (
            <DropdownMenuItem onClick={() => onCambiarEstado(presupuesto.id, 'aprobado')}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Aprobar
            </DropdownMenuItem>
          )}
          
          {canReject && (
            <DropdownMenuItem onClick={() => onCambiarEstado(presupuesto.id, 'rechazado')}>
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              Rechazar
            </DropdownMenuItem>
          )}

          {canMarkAsInvoiced && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => marcarComoFacturado(presupuesto.id)}>
                <DollarSign className="h-4 w-4 mr-2 text-purple-600" />
                Marcar como Facturado
              </DropdownMenuItem>
            </>
          )}
          
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onEliminarPresupuesto(presupuesto.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PresupuestoTableActions;
