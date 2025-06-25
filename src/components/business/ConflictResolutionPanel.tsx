
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useEnhancedBidirectionalSync } from '@/hooks/useEnhancedBidirectionalSync';
import { formatBusinessStateForDisplay } from '@/utils/businessCalculations';
import ConflictResolutionDialog from './ConflictResolutionDialog';

const ConflictResolutionPanel: React.FC = () => {
  const { syncConflicts, resolveConflict, loading } = useEnhancedBidirectionalSync();
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConflictClick = (conflict: any) => {
    setSelectedConflict(conflict);
    setDialogOpen(true);
  };

  const handleResolveConflict = async (negocioId: string, resolvedState: string, resolvedAmount?: number) => {
    await resolveConflict(negocioId, resolvedState, resolvedAmount);
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

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'state':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'amount':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'both':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConflictDescription = (conflict: any) => {
    switch (conflict.conflict_type) {
      case 'state':
        return `Estado diferente: App (${formatBusinessStateForDisplay(conflict.app_state)}) vs HubSpot (${formatBusinessStateForDisplay(conflict.hubspot_state)})`;
      case 'amount':
        return `Monto diferente: App (${formatCurrency(conflict.app_amount)}) vs HubSpot (${formatCurrency(conflict.hubspot_amount)})`;
      case 'both':
        return `Estado y monto diferentes`;
      default:
        return 'Conflicto desconocido';
    }
  };

  if (syncConflicts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              No hay conflictos de sincronización pendientes
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            <span>Conflictos de Sincronización ({syncConflicts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {syncConflicts.map((conflict) => (
            <div
              key={conflict.negocio_id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 transition-colors cursor-pointer"
              onClick={() => handleConflictClick(conflict)}
            >
              <div className="flex items-center space-x-3">
                {getConflictIcon(conflict.conflict_type)}
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {conflict.conflict_type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(conflict.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {getConflictDescription(conflict)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConflictClick(conflict);
                }}
                className="text-xs"
              >
                Resolver
              </Button>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-amber-100 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Nota:</strong> Los conflictos ocurren cuando hay diferencias entre los datos 
              de la aplicación y HubSpot. Selecciona qué valores deseas mantener para resolver cada conflicto.
            </p>
          </div>
        </CardContent>
      </Card>

      {selectedConflict && (
        <ConflictResolutionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          conflict={selectedConflict}
          onResolve={handleResolveConflict}
          loading={loading}
        />
      )}
    </>
  );
};

export default ConflictResolutionPanel;
