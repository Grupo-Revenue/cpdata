
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Upload, Download } from 'lucide-react';

interface SyncActionsProps {
  loading: boolean;
  onSyncToHubSpot: (forceAmount?: boolean) => void;
  onSyncFromHubSpot: () => void;
}

const SyncActions: React.FC<SyncActionsProps> = ({ 
  loading, 
  onSyncToHubSpot, 
  onSyncFromHubSpot 
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => onSyncToHubSpot(false)}
          disabled={loading}
          className="flex-1 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>Sincronizar a HubSpot</span>
        </Button>
        
        <Button
          onClick={() => onSyncToHubSpot(true)}
          disabled={loading}
          variant="outline"
          className="flex-1 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>Forzar Sincronización</span>
        </Button>
      </div>

      <Button
        onClick={onSyncFromHubSpot}
        disabled={loading}
        variant="outline"
        className="w-full flex items-center justify-center space-x-2"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Sincronizar desde HubSpot</span>
      </Button>
    </div>
  );
};

export default SyncActions;
