
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Settings, 
  RefreshCw,
  Play,
  Target,
  Zap
} from 'lucide-react';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useHubSpotData } from '@/hooks/useHubSpotData';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import { useToast } from '@/hooks/use-toast';

const BUSINESS_STATES = [
  { value: 'oportunidad_creada', label: 'Oportunidad Creada' },
  { value: 'presupuesto_enviado', label: 'Presupuesto Enviado' },
  { value: 'parcialmente_aceptado', label: 'Parcialmente Aceptado' },
  { value: 'negocio_aceptado', label: 'Negocio Aceptado' },
  { value: 'negocio_cerrado', label: 'Negocio Cerrado' },
  { value: 'negocio_perdido', label: 'Negocio Perdido' }
];

const BidirectionalSyncWizard: React.FC = () => {
  const { toast } = useToast();
  const { config, updateConfig } = useHubSpotConfig();
  const { pipelines, dealStages, fetchPipelines, fetchDealStages, clearStages } = useHubSpotData();
  const {
    stateMappings,
    saveStateMapping,
    pollHubSpotChanges,
    isPolling,
    loadStateMappings
  } = useBidirectionalSync();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [newMapping, setNewMapping] = useState({
    business_state: '',
    hubspot_pipeline_id: '',
    hubspot_stage_id: ''
  });
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // Check completed steps
    const completed: number[] = [];
    
    // Step 1: State mappings configured
    if (stateMappings.length > 0) {
      completed.push(1);
    }
    
    // Step 2: Bidirectional sync enabled
    if (config?.bidirectional_sync) {
      completed.push(2);
    }
    
    // Step 3: Configuration verified (if both 1 and 2 are complete)
    if (completed.includes(1) && completed.includes(2)) {
      completed.push(3);
    }
    
    setCompletedSteps(completed);
  }, [stateMappings, config]);

  useEffect(() => {
    if (config?.api_key_set) {
      fetchPipelines();
    }
  }, [config?.api_key_set]);

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipeline(pipelineId);
    setNewMapping(prev => ({ ...prev, hubspot_pipeline_id: pipelineId, hubspot_stage_id: '' }));
    if (pipelineId) {
      fetchDealStages(pipelineId);
    } else {
      clearStages();
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.business_state || !newMapping.hubspot_pipeline_id || !newMapping.hubspot_stage_id) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos",
        variant: "destructive"
      });
      return;
    }

    await saveStateMapping(newMapping);
    setNewMapping({ business_state: '', hubspot_pipeline_id: '', hubspot_stage_id: '' });
    setSelectedPipeline('');
    clearStages();
    
    toast({
      title: "Mapeo agregado",
      description: "El mapeo de estados se ha configurado correctamente"
    });
  };

  const enableBidirectionalSync = async () => {
    await updateConfig({
      bidirectional_sync: true,
      polling_interval_minutes: 1 // Para testing más frecuente
    });
    
    toast({
      title: "Sincronización habilitada",
      description: "La sincronización bidireccional está ahora activa"
    });
  };

  const testSync = async () => {
    setTestResult(null);
    try {
      await pollHubSpotChanges();
      setTestResult('success');
      toast({
        title: "Prueba exitosa",
        description: "La sincronización está funcionando correctamente"
      });
    } catch (error) {
      setTestResult('error');
      toast({
        title: "Error en la prueba",
        description: "Hubo un problema con la sincronización",
        variant: "destructive"
      });
    }
  };

  const optimizeSettings = async () => {
    await updateConfig({
      polling_interval_minutes: 5, // Intervalo optimizado
      conflict_resolution_strategy: 'manual'
    });
    
    toast({
      title: "Configuración optimizada",
      description: "Los ajustes han sido optimizados para el uso en producción"
    });
  };

  const getStepStatus = (step: number) => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: number) => {
    const status = getStepStatus(step);
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'current') return <div className="h-5 w-5 bg-blue-600 rounded-full" />;
    return <div className="h-5 w-5 bg-gray-300 rounded-full" />;
  };

  const progress = (completedSteps.length / 5) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración Guiada - Sincronización Bidireccional</span>
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progreso de configuración</span>
              <span>{completedSteps.length}/5 pasos completados</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Step 1: Configure State Mappings */}
            <div className={`border-l-4 pl-6 ${getStepStatus(1) === 'completed' ? 'border-green-500' : getStepStatus(1) === 'current' ? 'border-blue-500' : 'border-gray-300'}`}>
              <div className="flex items-center space-x-3 mb-4">
                {getStepIcon(1)}
                <h3 className="text-lg font-medium">Paso 1: Configurar Mapeos de Estados</h3>
                {getStepStatus(1) === 'completed' && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Completado
                  </Badge>
                )}
              </div>
              
              {getStepStatus(1) !== 'completed' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Mapea los estados de tus negocios con las etapas de HubSpot para que la sincronización funcione correctamente.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select 
                      value={newMapping.business_state}
                      onValueChange={(value) => setNewMapping(prev => ({ ...prev, business_state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Estado del negocio" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_STATES.map(state => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedPipeline} onValueChange={handlePipelineChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pipeline HubSpot" />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelines.map(pipeline => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>
                            {pipeline.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={newMapping.hubspot_stage_id}
                      onValueChange={(value) => setNewMapping(prev => ({ ...prev, hubspot_stage_id: value }))}
                      disabled={!selectedPipeline}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Etapa HubSpot" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealStages.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAddMapping} className="w-full md:w-auto">
                    Agregar Mapeo
                  </Button>
                </div>
              )}

              {stateMappings.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Mapeos configurados:</h4>
                  <div className="space-y-2">
                    {stateMappings.map((mapping) => (
                      <div key={mapping.id} className="flex items-center space-x-2 text-sm">
                        <Badge variant="outline">
                          {BUSINESS_STATES.find(s => s.value === mapping.business_state)?.label}
                        </Badge>
                        <ArrowRight className="h-3 w-3" />
                        <span>HubSpot Stage</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Enable Bidirectional Sync */}
            <div className={`border-l-4 pl-6 ${getStepStatus(2) === 'completed' ? 'border-green-500' : getStepStatus(2) === 'current' ? 'border-blue-500' : 'border-gray-300'}`}>
              <div className="flex items-center space-x-3 mb-4">
                {getStepIcon(2)}
                <h3 className="text-lg font-medium">Paso 2: Habilitar Sincronización Bidireccional</h3>
                {getStepStatus(2) === 'completed' && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Completado
                  </Badge>
                )}
              </div>
              
              {getStepStatus(2) !== 'completed' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Activa la sincronización bidireccional para que los cambios en HubSpot se reflejen automáticamente en tu aplicación.
                    </AlertDescription>
                  </Alert>
                  
                  <Button onClick={enableBidirectionalSync} disabled={!completedSteps.includes(1)}>
                    <Zap className="h-4 w-4 mr-2" />
                    Habilitar Sincronización Bidireccional
                  </Button>
                </div>
              )}
            </div>

            {/* Step 3: Verify Configuration */}
            <div className={`border-l-4 pl-6 ${getStepStatus(3) === 'completed' ? 'border-green-500' : getStepStatus(3) === 'current' ? 'border-blue-500' : 'border-gray-300'}`}>
              <div className="flex items-center space-x-3 mb-4">
                {getStepIcon(3)}
                <h3 className="text-lg font-medium">Paso 3: Verificar Configuración</h3>
                {getStepStatus(3) === 'completed' && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Completado
                  </Badge>
                )}
              </div>
              
              {getStepStatus(3) === 'completed' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Configuración verificada: {stateMappings.length} mapeos configurados y sincronización bidireccional habilitada.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Step 4: Test Sync */}
            <div className={`border-l-4 pl-6 ${getStepStatus(4) === 'completed' ? 'border-green-500' : getStepStatus(4) === 'current' ? 'border-blue-500' : 'border-gray-300'}`}>
              <div className="flex items-center space-x-3 mb-4">
                {getStepIcon(4)}
                <h3 className="text-lg font-medium">Paso 4: Probar Sincronización</h3>
                {testResult === 'success' && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Probado
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <Alert>
                  <Play className="h-4 w-4" />
                  <AlertDescription>
                    Ejecuta una prueba de sincronización para verificar que todo funcione correctamente.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={testSync} 
                  disabled={!completedSteps.includes(3) || isPolling}
                  variant={testResult === 'success' ? 'outline' : 'default'}
                >
                  {isPolling ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isPolling ? 'Probando...' : 'Probar Sincronización'}
                </Button>

                {testResult === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Prueba exitosa: La sincronización está funcionando correctamente.
                    </AlertDescription>
                  </Alert>
                )}

                {testResult === 'error' && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      ❌ Error en la prueba: Verifica la configuración y vuelve a intentar.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Step 5: Optimize Configuration */}
            <div className={`border-l-4 pl-6 ${getStepStatus(5) === 'completed' ? 'border-green-500' : getStepStatus(5) === 'current' ? 'border-blue-500' : 'border-gray-300'}`}>
              <div className="flex items-center space-x-3 mb-4">
                {getStepIcon(5)}
                <h3 className="text-lg font-medium">Paso 5: Optimizar Configuración</h3>
              </div>
              
              <div className="space-y-4">
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    Optimiza los ajustes para el uso en producción (intervalos de sincronización, resolución de conflictos, etc.).
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Intervalo de Polling (minutos)</Label>
                    <span className="text-sm text-gray-600 block">Actual: {config?.polling_interval_minutes || 30}</span>
                  </div>
                  <div>
                    <Label>Resolución de Conflictos</Label>
                    <span className="text-sm text-gray-600 block">Actual: {config?.conflict_resolution_strategy || 'manual'}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={optimizeSettings} 
                  disabled={testResult !== 'success'}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Optimizar para Producción
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BidirectionalSyncWizard;
