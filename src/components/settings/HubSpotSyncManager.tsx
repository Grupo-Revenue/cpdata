
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, AlertCircle, CheckCircle, Clock, PlayCircle } from 'lucide-react';

export const HubSpotSyncManager = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    failed: 0,
    success: 0,
    lastSync: null as string | null
  });

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('hubspot_sync_log')
        .select('status, processed_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pending = data.filter(log => log.status === 'pending').length;
      const failed = data.filter(log => log.status === 'failed').length;
      const success = data.filter(log => log.status === 'success').length;
      const lastSuccessfulSync = data.find(log => log.status === 'success' && log.processed_at);

      setStats({
        pending,
        failed,
        success,
        lastSync: lastSuccessfulSync?.processed_at || null
      });

    } catch (error) {
      console.error('Error loading sync stats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las estadísticas de sincronización"
      });
    }
  };

  const processPendingSync = async () => {
    setIsProcessing(true);
    try {
      // Use the new database function for processing pending syncs
      const { data, error } = await supabase.rpc('process_pending_hubspot_syncs');
      
      if (error) {
        throw error;
      }

      const result = data?.[0];
      if (result) {
        toast({
          title: "Procesamiento completado",
          description: `Procesados: ${result.processed}, Fallidos: ${result.failed}`
        });
      } else {
        toast({
          title: "Sin pendientes",
          description: "No hay sincronizaciones pendientes para procesar"
        });
      }

      // Reload stats
      await loadStats();

    } catch (error) {
      console.error('Error processing pending syncs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar sincronizaciones pendientes"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Gestor de Sincronización HubSpot
        </CardTitle>
        <CardDescription>
          Monitorea y gestiona las sincronizaciones con HubSpot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${stats.pending > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {stats.pending}
            </div>
            <div className="text-sm text-muted-foreground">Pendientes</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.success}
            </div>
            <div className="text-sm text-muted-foreground">Exitosas</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${stats.failed > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.failed}
            </div>
            <div className="text-sm text-muted-foreground">Fallidas</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.success > 0 ? Math.round((stats.success / (stats.success + stats.failed)) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Tasa de éxito</div>
          </div>
        </div>

        {/* Status Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Última sincronización exitosa:</span>
            <span className="font-medium">{formatLastSync(stats.lastSync)}</span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {stats.pending > 0 && (
            <Badge variant="outline" className="text-yellow-600">
              <Clock className="h-3 w-3 mr-1" />
              {stats.pending} pendientes
            </Badge>
          )}
          
          {stats.failed > 0 && (
            <Badge variant="outline" className="text-red-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              {stats.failed} fallidas
            </Badge>
          )}
          
          {stats.pending === 0 && stats.failed === 0 && (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Todo sincronizado
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadStats}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          
          {stats.pending > 0 && (
            <Button 
              size="sm" 
              onClick={processPendingSync}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Procesar Pendientes
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
