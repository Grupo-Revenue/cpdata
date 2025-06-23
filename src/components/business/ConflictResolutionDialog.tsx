
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
    app_amount?: number;
    hubspot_amount?: number;
    conflict_type: 'state' | 'amount' | 'both';
    timestamp: string;
  };
  onResolve: (negocioId: string, resolvedState: string, resolvedAmount?: number) => Promise<void>;
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
    await onResolve(conflict.negocio_id, conflict.app_state, conflict.app_amount);
    onOpenChange(false);
  };

  const handleResolveWithHubSpot = async () => {
    await onResolve(conflict.negocio_id, conflict.hubspot_state, conflict.hubspot_amount);
    onOpenChange(false);
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
            Se detectó un conflicto {conflict.conflict_type === 'both' ? 'de estado y monto' : 
                                   conflict.conflict_type === 'amount' ? 'de monto' : 'de estado'} entre 
            la aplicación y HubSpot. ¿Qué valores deseas mantener?
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            {/* State conflict */}
            {conflict.conflict_type !== 'amount' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Estado App:</span>
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
            )}
            
            {/* Amount conflict */}
            {conflict.conflict_type !== 'state' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Monto App:</span>
                  <Badge variant="outline" className="text-green-700">
                    {formatCurrency(conflict.app_amount)}
                  </Badge>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">HubSpot:</span>
                  <Badge variant="outline" className="text-blue-700">
                    {formatCurrency(conflict.hubspot_amount)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          
          {conflict.conflict_type === 'amount' && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <strong>Nota:</strong> El monto en la aplicación se calcula automáticamente desde los presupuestos. 
              Usar el valor de HubSpot requerirá ajustar los presupuestos manualmente.
            </div>
          )}
          
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
              Usar Valores de App
            </Button>
            <Button
              onClick={handleResolveWithHubSpot}
              disabled={loading}
              className="flex-1"
            >
              Usar Valores de HubSpot
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictResolutionDialog;
