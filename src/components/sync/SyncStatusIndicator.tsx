
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { useEnhancedBidirectionalSync } from '@/hooks/useEnhancedBidirectionalSync';
import { useSync } from '@/context/SyncContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';

const SyncStatusIndicator: React.FC = () => {
  const { config } = useHubSpotConfig();
  const { syncConflicts } = useEnhancedBidirectionalSync();
  const { syncStats, isProcessing } = useSync();

  if (!config?.api_key_set) {
    return null;
  }

  const hasIssues = syncConflicts.length > 0 || (syncStats?.total_failed || 0) > 0;
  const hasActivity = isProcessing || (syncStats?.total_processing || 0) > 0;

  const getStatusIcon = () => {
    if (hasIssues) return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (hasActivity) return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const getStatusColor = () => {
    if (hasIssues) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (hasActivity) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Badge className={`${getStatusColor()} flex items-center space-x-1`}>
            {getStatusIcon()}
            <span className="text-xs">Sync</span>
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Estado de Sincronización</h4>
            {getStatusIcon()}
          </div>
          
          {syncStats && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Pendientes:</span>
                <span className="font-medium">{syncStats.total_pending}</span>
              </div>
              <div className="flex justify-between">
                <span>Procesando:</span>
                <span className="font-medium">{syncStats.total_processing}</span>
              </div>
              <div className="flex justify-between">
                <span>Fallidos:</span>
                <span className="font-medium text-red-600">{syncStats.total_failed}</span>
              </div>
              <div className="flex justify-between">
                <span>Completados:</span>
                <span className="font-medium text-green-600">{syncStats.total_completed_today}</span>
              </div>
            </div>
          )}

          {syncConflicts.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Conflictos:</span>
                <Badge className="bg-amber-100 text-amber-800">
                  {syncConflicts.length}
                </Badge>
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600">
              {hasIssues ? 'Requiere atención' : 
               hasActivity ? 'Sincronizando...' : 
               'Todo sincronizado'}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SyncStatusIndicator;
