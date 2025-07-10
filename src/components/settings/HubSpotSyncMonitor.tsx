import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHubSpotSyncStats } from '@/hooks/hubspot/useHubSpotSyncStats';
import { RefreshCw, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const HubSpotSyncMonitor = () => {
  const { stats, loading, error, refetch, retryFailedSyncs } = useHubSpotSyncStats();
  const { toast } = useToast();

  const handleRetryFailedSyncs = async () => {
    const retriedCount = await retryFailedSyncs();
    if (retriedCount > 0) {
      toast({
        title: "Sincronización reiniciada",
        description: `Se reintentaron ${retriedCount} sincronizaciones fallidas.`,
      });
    } else {
      toast({
        title: "No hay sincronizaciones para reintentar",
        description: "Todas las sincronizaciones están al día.",
      });
    }
  };

  const getStatusColor = (value: number, type: 'success' | 'failed' | 'pending') => {
    if (type === 'success') return value > 0 ? 'text-green-600' : 'text-gray-500';
    if (type === 'failed') return value > 0 ? 'text-red-600' : 'text-green-600';
    if (type === 'pending') return value > 0 ? 'text-yellow-600' : 'text-green-600';
    return 'text-gray-500';
  };

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Nunca';
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Hace menos de 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Monitor de Sincronización HubSpot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Cargando estadísticas...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Monitor de Sincronización HubSpot
        </CardTitle>
        <CardDescription>
          Estado en tiempo real de las sincronizaciones con HubSpot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(stats.totalPending, 'pending')}`}>
              {stats.totalPending}
            </div>
            <div className="text-sm text-muted-foreground">Pendientes</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(stats.totalSuccessToday, 'success')}`}>
              {stats.totalSuccessToday}
            </div>
            <div className="text-sm text-muted-foreground">Éxito (hoy)</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(stats.totalFailedToday, 'failed')}`}>
              {stats.totalFailedToday}
            </div>
            <div className="text-sm text-muted-foreground">Fallidas (hoy)</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.successRatePercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Tasa de éxito</div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {stats.totalRetrying > 0 && (
            <Badge variant="outline" className="text-yellow-600">
              <Clock className="h-3 w-3 mr-1" />
              {stats.totalRetrying} reintentando
            </Badge>
          )}
          
          {stats.totalPending === 0 && stats.totalFailedToday === 0 && (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Todo sincronizado
            </Badge>
          )}
        </div>

        {/* Performance Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Tiempo promedio de ejecución:</span>
            <span className="font-medium">{stats.avgExecutionTimeMs.toFixed(0)}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Última sincronización:</span>
            <span className="font-medium">{formatLastSync(stats.lastSyncAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          {stats.totalFailedToday > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryFailedSyncs}
              className="text-orange-600 hover:text-orange-700"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Reintentar fallidas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};