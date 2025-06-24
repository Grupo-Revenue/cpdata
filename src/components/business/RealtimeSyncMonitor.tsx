
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';
import { useReactiveHubSpotSync } from '@/hooks/useReactiveHubSpotSync';

const RealtimeSyncMonitor: React.FC = () => {
  const { 
    syncQueue, 
    syncStats, 
    isProcessing, 
    retryFailedItems, 
    loadSyncData,
    processQueue
  } = useReactiveHubSpotSync();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'processing': return <RefreshCw className="w-3 h-3 animate-spin" />;
      case 'failed': return <AlertTriangle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  if (!syncStats && syncQueue.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="w-4 h-4" />
            <span>Sistema de sincronización HubSpot iniciado</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>Monitor de Sincronización</span>
            {isProcessing && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadSyncData}
              className="h-8 px-3"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Actualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={processQueue}
              disabled={isProcessing}
              className="h-8 px-3"
            >
              <Activity className="w-3 h-3 mr-1" />
              Procesar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistics */}
        {syncStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-lg font-bold text-yellow-800">{syncStats.total_pending}</div>
              <div className="text-xs text-yellow-600">Pendientes</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-800">{syncStats.total_processing}</div>
              <div className="text-xs text-blue-600">Procesando</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
              <div className="text-lg font-bold text-red-800">{syncStats.total_failed}</div>
              <div className="text-xs text-red-600">Fallidos</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-800">{syncStats.total_completed_today}</div>
              <div className="text-xs text-green-600">Hoy</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-lg font-bold text-gray-800">{syncStats.avg_processing_time_minutes}m</div>
              <div className="text-xs text-gray-600">Promedio</div>
            </div>
          </div>
        )}

        {/* Failed items alert */}
        {syncStats && syncStats.total_failed > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Hay {syncStats.total_failed} elementos fallidos en la cola de sincronización</span>
              <Button
                size="sm"
                variant="outline"
                onClick={retryFailedItems}
                className="ml-2 h-7 px-2 text-xs"
              >
                Reintentar Todo
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Queue Items */}
        {syncQueue.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gray-600" />
              <h4 className="font-medium text-sm">Cola de Sincronización</h4>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {syncQueue.slice(0, 20).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Badge className={`text-xs px-2 py-1 ${getStatusColor(item.status)}`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(item.status)}
                        <span>{item.status.toUpperCase()}</span>
                      </div>
                    </Badge>
                    <span className="font-medium">#{item.negocio_id.slice(-8)}</span>
                    <span className="text-gray-500 truncate">{item.operation_type}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    {item.attempts > 0 && (
                      <span className="text-xs">Intento {item.attempts}</span>
                    )}
                    <span className="text-xs">
                      {new Date(item.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {syncQueue.length > 20 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  ... y {syncQueue.length - 20} elementos más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Procesando cola de sincronización...</span>
            </div>
            <Progress value={undefined} className="w-full h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealtimeSyncMonitor;
