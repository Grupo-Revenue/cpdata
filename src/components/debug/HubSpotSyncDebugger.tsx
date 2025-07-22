
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHubSpotAmountSync } from '@/hooks/hubspot/useHubSpotAmountSync';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateBusinessValue } from '@/utils/businessValueCalculator';
import { Loader2, Bug, DollarSign } from 'lucide-react';

interface HubSpotSyncDebuggerProps {
  negocioId: string;
}

const HubSpotSyncDebugger: React.FC<HubSpotSyncDebuggerProps> = ({ negocioId }) => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const { syncAmountToHubSpot } = useHubSpotAmountSync();
  const { toast } = useToast();

  const runDiagnostic = async () => {
    setIsDebugging(true);
    setDebugResults(null);

    try {
      console.log('🔍 [HubSpot Debug] Starting diagnostic for negocio:', negocioId);

      // 1. Get current business data
      const { data: negocioData, error: negocioError } = await supabase
        .from('negocios')
        .select(`
          id,
          numero,
          hubspot_id,
          user_id,
          presupuestos:presupuestos(
            id,
            numero,
            total,
            estado,
            facturado
          )
        `)
        .eq('id', negocioId)
        .single();

      if (negocioError || !negocioData) {
        throw new Error(`Error getting business data: ${negocioError?.message}`);
      }

      // 2. Calculate expected value
      const calculatedValue = calculateBusinessValue(negocioData as any);

      // 3. Get current sync logs
      const { data: syncLogs } = await supabase
        .from('hubspot_sync_log')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('created_at', { ascending: false })
        .limit(5);

      const results = {
        negocio: {
          id: negocioData.id,
          numero: negocioData.numero,
          hubspot_id: negocioData.hubspot_id,
          user_id: negocioData.user_id
        },
        presupuestos: negocioData.presupuestos?.map(p => ({
          id: p.id,
          numero: p.numero,
          total: p.total,
          estado: p.estado,
          facturado: p.facturado,
          incluido_en_calculo: ['aprobado', 'publicado', 'rechazado'].includes(p.estado)
        })),
        calculatedValue,
        breakdown: {
          aprobados: negocioData.presupuestos?.filter(p => p.estado === 'aprobado').reduce((sum, p) => sum + (p.total || 0), 0) || 0,
          publicados: negocioData.presupuestos?.filter(p => p.estado === 'publicado').reduce((sum, p) => sum + (p.total || 0), 0) || 0,
          rechazados: negocioData.presupuestos?.filter(p => p.estado === 'rechazado').reduce((sum, p) => sum + (p.total || 0), 0) || 0,
          borradores: negocioData.presupuestos?.filter(p => p.estado === 'borrador').reduce((sum, p) => sum + (p.total || 0), 0) || 0
        },
        recentSyncLogs: syncLogs || []
      };

      console.log('🔍 [HubSpot Debug] Diagnostic results:', results);
      setDebugResults(results);

    } catch (error) {
      console.error('❌ [HubSpot Debug] Error during diagnostic:', error);
      toast({
        variant: "destructive",
        title: "Error en diagnóstico",
        description: `Error: ${error.message}`
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const forceSync = async () => {
    try {
      console.log('🚀 [HubSpot Debug] Forcing manual sync for negocio:', negocioId);
      await syncAmountToHubSpot(negocioId);
      
      // Refresh diagnostic after sync
      setTimeout(() => {
        runDiagnostic();
      }, 2000);
      
    } catch (error) {
      console.error('❌ [HubSpot Debug] Error during manual sync:', error);
      toast({
        variant: "destructive",
        title: "Error en sincronización manual",
        description: `Error: ${error.message}`
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          HubSpot Sync Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostic} 
            disabled={isDebugging}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isDebugging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bug className="h-4 w-4" />
            )}
            Ejecutar Diagnóstico
          </Button>
          
          <Button 
            onClick={forceSync}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Forzar Sincronización
          </Button>
        </div>

        {debugResults && (
          <div className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Información del Negocio</h4>
              <div className="text-sm space-y-1">
                <p><strong>ID:</strong> {debugResults.negocio.id}</p>
                <p><strong>Número:</strong> {debugResults.negocio.numero}</p>
                <p><strong>HubSpot ID:</strong> {debugResults.negocio.hubspot_id || 'No asignado'}</p>
                <p><strong>Usuario:</strong> {debugResults.negocio.user_id}</p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Cálculo de Valor</h4>
              <div className="text-sm space-y-1">
                <p><strong>Valor Calculado:</strong> ${debugResults.calculatedValue?.toLocaleString()}</p>
                <div className="mt-2">
                  <p><strong>Desglose:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>Aprobados: ${debugResults.breakdown.aprobados?.toLocaleString()} ✅</li>
                    <li>Publicados: ${debugResults.breakdown.publicados?.toLocaleString()} ✅</li>
                    <li>Rechazados: ${debugResults.breakdown.rechazados?.toLocaleString()} ✅</li>
                    <li>Borradores: ${debugResults.breakdown.borradores?.toLocaleString()} ❌ (Excluidos)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Presupuestos ({debugResults.presupuestos?.length || 0})</h4>
              <div className="space-y-2">
                {debugResults.presupuestos?.map((p: any) => (
                  <div key={p.id} className="text-sm border-l-2 border-gray-300 pl-3">
                    <p><strong>#{p.numero}</strong> - ${p.total?.toLocaleString()} - {p.estado}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.incluido_en_calculo ? '✅ Incluido en cálculo' : '❌ Excluido del cálculo'}
                      {p.facturado && ' • Facturado'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Logs de Sincronización Recientes</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {debugResults.recentSyncLogs?.length > 0 ? (
                  debugResults.recentSyncLogs.map((log: any) => (
                    <div key={log.id} className="text-xs border-l-2 border-gray-300 pl-3">
                      <p><strong>{log.operation_type}</strong> - {log.status}</p>
                      <p className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()} • {log.trigger_source}
                      </p>
                      {log.error_message && (
                        <p className="text-red-600">Error: {log.error_message}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay logs recientes</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HubSpotSyncDebugger;
