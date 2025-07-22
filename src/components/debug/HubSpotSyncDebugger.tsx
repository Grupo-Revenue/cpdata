
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DebugBusiness {
  id: string;
  numero: number;
  estado: string;
  hubspot_id: string | null;
  presupuestos: DebugPresupuesto[];
}

interface DebugPresupuesto {
  id: string;
  nombre: string;
  total: number;
  estado: string;
  facturado: boolean;
}

interface SyncLog {
  id: string;
  operation_type: string;
  status: string;
  created_at: string;
  error_message: string | null;
  request_payload: any;
}

interface HubSpotSyncDebuggerProps {
  negocioId?: string;
}

const HubSpotSyncDebugger: React.FC<HubSpotSyncDebuggerProps> = ({ negocioId }) => {
  const [businesses, setBusinesses] = useState<DebugBusiness[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);

  const loadBusinessData = async () => {
    setLoading(true);
    try {
      console.log('🔍 [HubSpot Debugger] Loading business data...');
      
      const { data: negociosData, error: negociosError } = await supabase
        .from('negocios')
        .select(`
          id,
          numero,
          estado,
          hubspot_id,
          presupuestos!inner (
            id,
            nombre,
            total,
            estado,
            facturado
          )
        `)
        .order('numero', { ascending: false })
        .limit(10);

      if (negociosError) {
        console.error('❌ [HubSpot Debugger] Error loading businesses:', negociosError);
        throw negociosError;
      }

      console.log('✅ [HubSpot Debugger] Loaded businesses:', negociosData?.length || 0);
      setBusinesses(negociosData || []);

      // Load sync logs
      const { data: logsData, error: logsError } = await supabase
        .from('hubspot_sync_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError) {
        console.error('❌ [HubSpot Debugger] Error loading sync logs:', logsError);
      } else {
        console.log('✅ [HubSpot Debugger] Loaded sync logs:', logsData?.length || 0);
        setSyncLogs(logsData || []);
      }

    } catch (error) {
      console.error('❌ [HubSpot Debugger] Load error:', error);
      toast.error('Error cargando datos de diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const calculateBusinessValue = (presupuestos: DebugPresupuesto[]) => {
    return presupuestos
      .filter(p => p.estado === 'aprobado' && !p.facturado)
      .reduce((sum, p) => sum + Number(p.total), 0);
  };

  const getBusinessStats = (presupuestos: DebugPresupuesto[]) => {
    const total = presupuestos.length;
    const approved = presupuestos.filter(p => p.estado === 'aprobado').length;
    const published = presupuestos.filter(p => p.estado === 'publicado').length;
    const invoiced = presupuestos.filter(p => p.facturado).length;
    
    return { total, approved, published, invoiced };
  };

  const triggerManualSync = async (businessId: string) => {
    try {
      console.log('🚀 [HubSpot Debugger] Triggering manual sync for:', businessId);
      
      const { data, error } = await supabase.functions.invoke('hubspot-deal-amount-update', {
        body: { 
          negocio_id: businessId,
          trigger_source: 'manual_debug'
        }
      });

      if (error) {
        console.error('❌ [HubSpot Debugger] Manual sync error:', error);
        toast.error('Error en sincronización manual');
      } else {
        console.log('✅ [HubSpot Debugger] Manual sync triggered:', data);
        toast.success('Sincronización manual iniciada');
        // Reload logs after a short delay
        setTimeout(loadBusinessData, 2000);
      }
    } catch (error) {
      console.error('❌ [HubSpot Debugger] Manual sync exception:', error);
      toast.error('Error ejecutando sincronización manual');
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HubSpot Sync Debugger</h1>
          <p className="text-muted-foreground">Diagnóstico y monitoreo de sincronización</p>
        </div>
        <Button onClick={loadBusinessData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Business Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Negocios</CardTitle>
          <CardDescription>
            Estado actual de los negocios y sus presupuestos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {businesses.map(business => {
              const stats = getBusinessStats(business.presupuestos);
              const calculatedValue = calculateBusinessValue(business.presupuestos);
              
              return (
                <div key={business.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">Negocio #{business.numero}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{business.estado}</Badge>
                        {business.hubspot_id ? (
                          <Badge variant="default">HubSpot: {business.hubspot_id}</Badge>
                        ) : (
                          <Badge variant="destructive">Sin HubSpot ID</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrency(calculatedValue)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Valor calculado
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                      <p className="text-xs text-muted-foreground">Aprobados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.published}</p>
                      <p className="text-xs text-muted-foreground">Publicados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.invoiced}</p>
                      <p className="text-xs text-muted-foreground">Facturados</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedBusiness(
                        selectedBusiness === business.id ? null : business.id
                      )}
                    >
                      {selectedBusiness === business.id ? 'Ocultar' : 'Ver'} Presupuestos
                    </Button>
                    {business.hubspot_id && (
                      <Button 
                        size="sm" 
                        onClick={() => triggerManualSync(business.id)}
                        disabled={loading}
                      >
                        Sincronizar Manual
                      </Button>
                    )}
                  </div>

                  {selectedBusiness === business.id && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-medium mb-2">Presupuestos:</h4>
                      <div className="space-y-2">
                        {business.presupuestos.map(presupuesto => (
                          <div key={presupuesto.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <span className="font-medium">{presupuesto.nombre}</span>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary">{presupuesto.estado}</Badge>
                                {presupuesto.facturado && (
                                  <Badge variant="default">Facturado</Badge>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold">
                              {formatCurrency(Number(presupuesto.total))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Sincronización</CardTitle>
          <CardDescription>
            Historial reciente de sincronizaciones con HubSpot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {syncLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-medium">{log.operation_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('es-CL')}
                    </p>
                    {log.error_message && (
                      <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                    )}
                  </div>
                </div>
                <Badge variant={log.status === 'success' ? 'default' : 
                              log.status === 'failed' ? 'destructive' : 'secondary'}>
                  {log.status}
                </Badge>
              </div>
            ))}
            {syncLogs.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay logs de sincronización disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubSpotSyncDebugger;
