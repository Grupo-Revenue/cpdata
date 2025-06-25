
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Zap,
  BarChart3,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useEnhancedBidirectionalSync } from '@/hooks/useEnhancedBidirectionalSync';
import { useReactiveHubSpotSync } from '@/hooks/useReactiveHubSpotSync';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import RealtimeSyncMonitor from './RealtimeSyncMonitor';

const SyncMonitorDashboard: React.FC = () => {
  const { config } = useHubSpotConfig();
  const { 
    syncConflicts, 
    resolveConflict, 
    syncAllAmountsToHubSpot,
    loading: syncLoading 
  } = useEnhancedBidirectionalSync();
  
  const { 
    syncStats, 
    retryFailedItems,
    loadSyncData,
    isProcessing 
  } = useReactiveHubSpotSync();

  const [activeTab, setActiveTab] = useState('overview');

  const getConflictBadgeColor = (type: string) => {
    switch (type) {
      case 'both': return 'bg-red-100 text-red-800 border-red-200';
      case 'amount': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'state': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: 'use_app' | 'use_hubspot') => {
    await resolveConflict(conflictId, resolution);
  };

  const handleMassSync = async () => {
    await syncAllAmountsToHubSpot();
  };

  const handleRetryFailed = async () => {
    await retryFailedItems();
  };

  if (!config?.api_key_set) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-yellow-800">
            <Settings className="w-5 h-5" />
            <div>
              <h3 className="font-medium">HubSpot no configurado</h3>
              <p className="text-sm text-yellow-600 mt-1">
                Configure HubSpot en la página de configuración para usar la sincronización bidireccional.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Zap className="w-6 h-6 text-blue-600" />
          <span>Monitor de Sincronización HubSpot</span>
          {isProcessing && <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />}
        </h2>
        <div className="flex space-x-2">
          <Button
            onClick={loadSyncData}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </Button>
          <Button
            onClick={handleMassSync}
            disabled={syncLoading}
            size="sm"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Sync Masivo</span>
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {syncStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{syncStats.total_pending}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{syncStats.total_processing}</div>
              <div className="text-sm text-gray-600">Procesando</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{syncStats.total_failed}</div>
              <div className="text-sm text-gray-600">Fallidos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{syncStats.total_completed_today}</div>
              <div className="text-sm text-gray-600">Completados Hoy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{syncStats.avg_processing_time_minutes}m</div>
              <div className="text-sm text-gray-600">Tiempo Promedio</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {syncStats && syncStats.total_failed > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Hay {syncStats.total_failed} elementos fallidos en la cola de sincronización</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetryFailed}
              className="ml-2"
            >
              Reintentar Todo
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {syncConflicts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Hay {syncConflicts.length} conflictos de sincronización que requieren resolución manual.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="conflicts">Conflictos ({syncConflicts.length})</TabsTrigger>
          <TabsTrigger value="queue">Cola de Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Estado de Configuración</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Key configurada</span>
                  <Badge className={config.api_key_set ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {config.api_key_set ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sincronización automática</span>
                  <Badge className={config.auto_sync ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {config.auto_sync ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sincronización bidireccional</span>
                  <Badge className={config.bidirectional_sync ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                    {config.bidirectional_sync ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Intervalo de polling</span>
                  <span className="text-sm font-medium">{config.polling_interval_minutes}m</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>Actividad Reciente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Último polling</span>
                    <span className="text-gray-600">
                      {config.last_poll_at ? new Date(config.last_poll_at).toLocaleString() : 'Nunca'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Conflictos activos</span>
                    <span className="font-medium">{syncConflicts.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Elementos en cola</span>
                    <span className="font-medium">{syncStats?.total_pending || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          {syncConflicts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay conflictos</h3>
                <p className="text-gray-600">Todos los datos están sincronizados correctamente.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {syncConflicts.map((conflict) => (
                <Card key={conflict.id} className="border-amber-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getConflictBadgeColor(conflict.conflict_type)}>
                            {conflict.conflict_type === 'both' ? 'Estado y Monto' : 
                             conflict.conflict_type === 'amount' ? 'Monto' : 'Estado'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Negocio #{conflict.negocio_id.slice(-8)}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          {conflict.conflict_type !== 'amount' && (
                            <div>
                              <span className="font-medium">Estado:</span>
                              <span className="ml-2">App: {conflict.app_state}</span>
                              <span className="ml-2 text-gray-500">vs</span>
                              <span className="ml-2">HubSpot: {conflict.hubspot_state}</span>
                            </div>
                          )}
                          {conflict.conflict_type !== 'state' && (
                            <div>
                              <span className="font-medium">Monto:</span>
                              <span className="ml-2">App: ${conflict.app_amount?.toLocaleString()}</span>
                              <span className="ml-2 text-gray-500">vs</span>
                              <span className="ml-2">HubSpot: ${conflict.hubspot_amount?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveConflict(conflict.id, 'use_app')}
                          disabled={syncLoading}
                        >
                          Usar App
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveConflict(conflict.id, 'use_hubspot')}
                          disabled={syncLoading}
                        >
                          Usar HubSpot
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="queue">
          <RealtimeSyncMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncMonitorDashboard;
