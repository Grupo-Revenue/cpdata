
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Activity, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useSync } from '@/context/SyncContext';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';

const SyncMonitorDashboard: React.FC = () => {
  const { config } = useHubSpotConfig();
  const { 
    syncQueue, 
    syncStats, 
    isProcessing, 
    processQueue, 
    loadSyncData 
  } = useSync();

  const handleRefresh = async () => {
    await loadSyncData();
  };

  const handleForceProcess = async () => {
    await processQueue();
  };

  if (!config?.api_key_set) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Configurar HubSpot API para ver el estado de sincronización</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        <div className="flex items-center space-x-1">
          {getStatusIcon(status)}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {syncStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{syncStats.total_pending}</div>
                <div className="text-sm text-gray-600">Pendientes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{syncStats.total_processing}</div>
                <div className="text-sm text-gray-600">Procesando</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{syncStats.total_failed}</div>
                <div className="text-sm text-gray-600">Fallidos</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{syncStats.total_completed_today}</div>
                <div className="text-sm text-gray-600">Completados Hoy</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Queue Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Cola de Sincronización</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={isProcessing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button 
                onClick={handleForceProcess} 
                variant="outline" 
                size="sm"
                disabled={isProcessing}
              >
                <Activity className="w-4 h-4 mr-2" />
                Procesar Ahora
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {syncQueue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay elementos en la cola de sincronización</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Operación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead>Intentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncQueue.slice(0, 10).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.negocio_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.operation_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <Badge variant={item.priority <= 3 ? 'destructive' : item.priority <= 7 ? 'default' : 'secondary'}>
                            {item.priority}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {new Date(item.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className={`text-sm ${item.attempts > 1 ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                            {item.attempts}/{item.max_attempts}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncMonitorDashboard;
