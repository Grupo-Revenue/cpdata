
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { formatBusinessStateForDisplay } from '@/utils/businessCalculations';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: {
    negocio_id: string;
    app_state: string;
    hubspot_state: string;
    timestamp: string;
  };
  onResolve: (negocioId: string, resolvedState: string) => Promise<void>;
  loading?: boolean;
}

const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  open,
  onOpenChange,
  conflict,
  onResolve,
  loading = false
}) => {
  const handleResolveWithApp = async () => {
    await onResolve(conflict.negocio_id, conflict.app_state);
    onOpenChange(false);
  };

  const handleResolveWithHubSpot = async () => {
    await onResolve(conflict.negocio_id, conflict.hubspot_state);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Conflicto de Sincronización</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Se detectó un conflicto entre el estado del negocio en la aplicación y en HubSpot. 
            ¿Qué estado deseas mantener?
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">App:</span>
                <Badge variant="outline">
                  {formatBusinessStateForDisplay(conflict.app_state)}
                </Badge>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">HubSpot:</span>
                <Badge variant="outline">
                  {formatBusinessStateForDisplay(conflict.hubspot_state)}
                </Badge>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500">
            Conflicto detectado: {new Date(conflict.timestamp).toLocaleString()}
          </p>
        </div>

        <DialogFooter className="sm:justify-start">
          <div className="flex space-x-2 w-full">
            <Button
              onClick={handleResolveWithApp}
              disabled={loading}
              className="flex-1"
              variant="outline"
            >
              Usar Estado de App
            </Button>
            <Button
              onClick={handleResolveWithHubSpot}
              disabled={loading}
              className="flex-1"
            >
              Usar Estado de HubSpot
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictResolutionDialog;
