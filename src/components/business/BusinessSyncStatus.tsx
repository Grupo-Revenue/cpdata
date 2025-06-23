
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import { Negocio } from '@/types';

interface BusinessSyncStatusProps {
  negocio: Negocio;
}

const BusinessSyncStatus: React.FC<BusinessSyncStatusProps> = ({ negocio }) => {
  const { syncConflicts, syncToHubSpot, syncFromHubSpot, loading } = useBidirectionalSync();
  
  // Check if this business has any conflicts
  const hasConflict = syncConflicts.some(conflict => conflict.negocio_id === negocio.id);
  const conflict = syncConflicts.find(conflict => conflict.negocio_id === negocio.id);

  const handleSyncToHubSpot = async () => {
    await syncToHubSpot(negocio.id);
  };

  const handleSyncFromHubSpot = async () => {
    await syncFromHubSpot(negocio.id);
  };

  if (hasConflict && conflict) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-800">Conflicto de Sincronización</p>
          <p className="text-xs text-amber-600 truncate">
            App: {conflict.app_state} | HubSpot: {conflict.hubspot_state}
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
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSyncToHubSpot}
        disabled={loading}
        className="text-xs h-6 px-2"
        title="Sincronizar a HubSpot"
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
    </div>
  );
};

export default BusinessSyncStatus;
