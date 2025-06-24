
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, ExternalLink, DollarSign, RefreshCcw } from 'lucide-react';
import { useEnhancedBidirectionalSync } from '@/hooks/useEnhancedBidirectionalSync';
import { Negocio } from '@/types';
import { calcularValorNegocio } from '@/utils/businessCalculations';

interface BusinessSyncStatusProps {
  negocio: Negocio;
}

const BusinessSyncStatus: React.FC<BusinessSyncStatusProps> = ({ negocio }) => {
  const { 
    syncConflicts, 
    syncToHubSpot, 
    syncFromHubSpot, 
    syncAllAmountsToHubSpot,
    loading 
  } = useEnhancedBidirectionalSync();
  
  // Check if this business has conflicts
  const hasConflict = syncConflicts.some(conflict => conflict.negocio_id === negocio.id);
  const conflict = syncConflicts.find(conflict => conflict.negocio_id === negocio.id);

  // Calculate current business value
  const currentAmount = calcularValorNegocio(negocio);

  const handleSyncToHubSpot = async () => {
    console.log('Manual sync to HubSpot triggered for business:', negocio.id);
    await syncToHubSpot(negocio.id);
  };

  const handleSyncFromHubSpot = async () => {
    console.log('Manual sync from HubSpot triggered for business:', negocio.id);
    await syncFromHubSpot(negocio.id);
  };

  const handleSyncAmountToHubSpot = async () => {
    console.log('Force amount sync triggered for business:', negocio.id, 'Amount:', currentAmount);
    await syncToHubSpot(negocio.id, true);
  };

  const handleMassAmountSync = async () => {
    console.log('Mass amount sync triggered');
    await syncAllAmountsToHubSpot();
  };

  if (hasConflict && conflict) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-800">
              Conflicto: {conflict.conflict_type === 'both' ? 'Estado y Monto' : 
                         conflict.conflict_type === 'amount' ? 'Monto' : 'Estado'}
            </p>
            <p className="text-xs text-amber-600 truncate">
              {conflict.conflict_type !== 'amount' && (
                <>App: {conflict.app_state} | HubSpot: {conflict.hubspot_state}</>
              )}
              {conflict.conflict_type === 'both' && <br />}
              {conflict.conflict_type !== 'state' && (
                <>App: ${conflict.app_amount} | HubSpot: ${conflict.hubspot_amount}</>
              )}
            </p>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncToHubSpot}
              disabled={loading}
              className="text-xs h-6"
            >
              Usar App
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncFromHubSpot}
              disabled={loading}
              className="text-xs h-6"
            >
              Usar HubSpot
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Valor calculado: ${currentAmount.toLocaleString('es-CL')}</span>
      </div>
      
      {/* Regular sync controls */}
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSyncToHubSpot}
          disabled={loading}
          className="text-xs h-6 px-2"
          title="Sincronizar a HubSpot (estado y monto)"
        >
          {loading ? (
            <Clock className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSyncFromHubSpot}
          disabled={loading}
          className="text-xs h-6 px-2"
          title="Sincronizar desde HubSpot"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSyncAmountToHubSpot}
          disabled={loading}
          className="text-xs h-6 px-2"
          title="Forzar sincronización de monto a HubSpot"
        >
          <DollarSign className="w-3 h-3" />
        </Button>
      </div>
      
      {/* Mass sync button for amounts */}
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleMassAmountSync}
          disabled={loading}
          className="text-xs h-6 px-2"
          title="Sincronizar todos los montos a HubSpot"
        >
          {loading ? (
            <Clock className="w-3 h-3 animate-spin mr-1" />
          ) : (
            <RefreshCcw className="w-3 h-3 mr-1" />
          )}
          Sync Masivo
        </Button>
      </div>
    </div>
  );
};

export default BusinessSyncStatus;
