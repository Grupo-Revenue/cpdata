
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings,
  Database,
  ExternalLink,
  Info
} from 'lucide-react';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { supabase } from '@/integrations/supabase/client';
import { Negocio } from '@/types';

interface SyncVerificationPanelProps {
  negocio: Negocio;
}

interface VerificationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
}

const SyncVerificationPanel: React.FC<SyncVerificationPanelProps> = ({ negocio }) => {
  const { config } = useHubSpotConfig();
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    { id: 'config', name: 'Configuración HubSpot', status: 'pending' },
    { id: 'mapping', name: 'Mapeo de Estados', status: 'pending' },
    { id: 'sync_record', name: 'Registro de Sincronización', status: 'pending' },
    { id: 'queue_status', name: 'Estado de Cola', status: 'pending' },
    { id: 'business_data', name: 'Datos del Negocio', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const updateStep = (stepId: string, updates: Partial<VerificationStep>) => {
    setVerificationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const runVerification = async () => {
    setIsRunning(true);
    setOverallProgress(0);

    try {
      // Step 1: Check HubSpot Configuration
      updateStep('config', { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!config?.api_key_set) {
        updateStep('config', { 
          status: 'error', 
          message: 'API key de HubSpot no configurada'
        });
      } else {
        updateStep('config', { 
          status: 'success', 
          message: 'Configuración correcta',
          details: {
            auto_sync: config.auto_sync,
            bidirectional_sync: config.bidirectional_sync,
            default_pipeline: config.default_pipeline_id
          }
        });
      }
      setOverallProgress(20);

      // Step 2: Check State Mapping
      updateStep('mapping', { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const { data: mappingData, error: mappingError } = await supabase
          .from('hubspot_state_mapping')
          .select('*')
          .eq('user_id', negocio.user_id)
          .eq('business_state', negocio.estado);

        if (mappingError) throw mappingError;

        if (!mappingData || mappingData.length === 0) {
          updateStep('mapping', { 
            status: 'error', 
            message: `No hay mapeo configurado para el estado: ${negocio.estado}`
          });
        } else {
          updateStep('mapping', { 
            status: 'success', 
            message: 'Mapeo de estados configurado',
            details: mappingData[0]
          });
        }
      } catch (error) {
        updateStep('mapping', { 
          status: 'error', 
          message: `Error verificando mapeo: ${error.message}`
        });
      }
      setOverallProgress(40);

      // Step 3: Check Sync Record
      updateStep('sync_record', { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const { data: syncData, error: syncError } = await supabase
          .from('hubspot_sync')
          .select('*')
          .eq('negocio_id', negocio.id)
          .single();

        if (syncError && syncError.code !== 'PGRST116') throw syncError;

        if (!syncData) {
          updateStep('sync_record', { 
            status: 'error', 
            message: 'No existe registro de sincronización'
          });
        } else {
          updateStep('sync_record', { 
            status: 'success', 
            message: 'Registro de sincronización encontrado',
            details: {
              hubspot_deal_id: syncData.hubspot_deal_id,
              last_sync_at: syncData.last_sync_at,
              sync_status: syncData.sync_status,
              sync_direction: syncData.sync_direction
            }
          });
        }
      } catch (error) {
        updateStep('sync_record', { 
          status: 'error', 
          message: `Error verificando registro: ${error.message}`
        });
      }
      setOverallProgress(60);

      // Step 4: Check Queue Status
      updateStep('queue_status', { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const { data: queueData, error: queueError } = await supabase
          .from('hubspot_sync_queue')
          .select('*')
          .eq('negocio_id', negocio.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (queueError) throw queueError;

        updateStep('queue_status', { 
          status: 'success', 
          message: `${queueData?.length || 0} elementos en cola`,
          details: queueData
        });
      } catch (error) {
        updateStep('queue_status', { 
          status: 'error', 
          message: `Error verificando cola: ${error.message}`
        });
      }
      setOverallProgress(80);

      // Step 5: Validate Business Data
      updateStep('business_data', { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const businessValue = negocio.presupuestos?.reduce((sum, p) => {
        if (p.estado === 'aprobado') return sum + parseFloat(p.total || '0');
        return sum;
      }, 0) || 0;

      const sentValue = negocio.presupuestos?.reduce((sum, p) => {
        if (p.estado === 'enviado') return sum + parseFloat(p.total || '0');
        return sum;
      }, 0) || 0;

      const finalValue = businessValue > 0 ? businessValue : sentValue;

      updateStep('business_data', { 
        status: 'success', 
        message: 'Datos del negocio validados',
        details: {
          estado: negocio.estado,
          valor_calculado: finalValue,
          presupuestos_total: negocio.presupuestos?.length || 0,
          presupuestos_aprobados: negocio.presupuestos?.filter(p => p.estado === 'aprobado').length || 0,
          presupuestos_enviados: negocio.presupuestos?.filter(p => p.estado === 'enviado').length || 0
        }
      });
      setOverallProgress(100);

    } catch (error) {
      console.error('[SyncVerificationPanel] Verification error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Settings className="w-5 h-5 text-purple-600" />
            <span>Verificación de Sincronización</span>
          </CardTitle>
          <Button
            onClick={runVerification}
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Verificar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso de verificación</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>
        )}

        <div className="space-y-3">
          {verificationSteps.map((step) => (
            <div key={step.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{step.name}</h4>
                  <Badge 
                    variant={step.status === 'success' ? 'default' : step.status === 'error' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {step.status}
                  </Badge>
                </div>
                {step.message && (
                  <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                )}
                {step.details && (
                  <div className="mt-2 text-xs text-gray-500">
                    <details>
                      <summary className="cursor-pointer hover:text-gray-700">
                        Ver detalles
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta herramienta verifica la configuración y el estado de sincronización para diagnosticar problemas.
            Ejecuta la verificación antes de intentar sincronizar manualmente.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SyncVerificationPanel;
