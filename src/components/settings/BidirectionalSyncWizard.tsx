import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Settings, 
  RefreshCw,
  Play,
  Target,
  Zap,
  Plus,
  Trash2,
  Edit3
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
    deleteStateMapping,
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
  const [editingMapping, setEditingMapping] = useState<string | null>(null);

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

    // Check for duplicates
    const existingMapping = stateMappings.find(m => m.business_state === newMapping.business_state);
    if (existingMapping) {
      toast({
        title: "Estado ya mapeado",
        description: "Este estado del negocio ya tiene un mapeo configurado",
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

  const handleDeleteMapping = async (mappingId: string) => {
    await deleteStateMapping(mappingId);
    toast({
      title: "Mapeo eliminado",
      description: "El mapeo de estados se ha eliminado correctamente"
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

  const getBusinessStateLabel = (state: string) => {
    return BUSINESS_STATES.find(s => s.value === state)?.label || state;
  };

  const getPipelineLabel = (pipelineId: string) => {
    return pipelines.find(p => p.id === pipelineId)?.label || 'Pipeline';
  };

  const getStageLabel = (stageId: string) => {
    return dealStages.find(s => s.id === stageId)?.label || 'Etapa';
  };

  const getAvailableBusinessStates = () => {
    const mappedStates = stateMappings.map(m => m.business_state);
    return BUSINESS_STATES.filter(state => !mappedStates.includes(state.value));
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
            {/* Step Navigation */}
            <div className="flex justify-center space-x-4 mb-8">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  variant={currentStep === num ? "default" : completedSteps.includes(num) ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentStep(num)}
                  className="flex items-center space-x-2"
                >
                  {getStepIcon(num)}
                  <span className="hidden md:inline">Paso {num}</span>
                </Button>
              ))}
            </div>

            {/* Step 1: Configure State Mappings */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  {getStepIcon(1)}
                  <h3 className="text-lg font-medium">Paso 1: Configurar Mapeos de Estados</h3>
                  {getStepStatus(1) === 'completed' && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Completado
                    </Badge>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Mapea los estados de tus negocios con las etapas de HubSpot para que la sincronización funcione correctamente.
                  </AlertDescription>
                </Alert>

                {/* Add New Mapping Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Agregar Nuevo Mapeo</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select 
                        value={newMapping.business_state}
                        onValueChange={(value) => setNewMapping(prev => ({ ...prev, business_state: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Estado del negocio" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableBusinessStates().map(state => (
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
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Mapeo
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Mappings */}
                {stateMappings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mapeos Configurados ({stateMappings.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Estado del Negocio</TableHead>
                            <TableHead>Pipeline HubSpot</TableHead>
                            <TableHead>Etapa HubSpot</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stateMappings.map((mapping) => (
                            <TableRow key={mapping.id}>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {getBusinessStateLabel(mapping.business_state)}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {getPipelineLabel(mapping.hubspot_pipeline_id)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {getStageLabel(mapping.hubspot_stage_id)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar mapeo?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará permanentemente el mapeo de estado "{getBusinessStateLabel(mapping.business_state)}". 
                                          Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteMapping(mapping.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {stateMappings.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No hay mapeos configurados. Agrega al menos un mapeo para continuar con la configuración.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 2: Enable Bidirectional Sync */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  {getStepIcon(2)}
                  <h3 className="text-lg font-medium">Paso 2: Habilitar Sincronización Bidireccional</h3>
                  {getStepStatus(2) === 'completed' && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Completado
                    </Badge>
                  )}
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Activa la sincronización bidireccional para que los cambios en HubSpot se reflejen automáticamente en tu aplicación.
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col space-y-4">
                  {!completedSteps.includes(1) && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Primero debes configurar al menos un mapeo de estados en el Paso 1.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    onClick={enableBidirectionalSync} 
                    disabled={!completedSteps.includes(1) || config?.bidirectional_sync}
                    className="w-full md:w-auto"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {config?.bidirectional_sync ? 'Sincronización Habilitada' : 'Habilitar Sincronización Bidireccional'}
                  </Button>

                  {config?.bidirectional_sync && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ✅ La sincronización bidireccional está habilitada y funcionando.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {/* Steps 3, 4, 5 remain the same structure */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  {getStepIcon(3)}
                  <h3 className="text-lg font-medium">Paso 3: Verificar Configuración</h3>
                  {getStepStatus(3) === 'completed' && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Completado
                    </Badge>
                  )}
                </div>
                
                {getStepStatus(3) === 'completed' ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Configuración verificada: {stateMappings.length} mapeos configurados y sincronización bidireccional habilitada.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Complete los pasos anteriores para verificar la configuración.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  {getStepIcon(4)}
                  <h3 className="text-lg font-medium">Paso 4: Probar Sincronización</h3>
                  {testResult === 'success' && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Probado
                    </Badge>
                  )}
                </div>
                
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
                  className="w-full md:w-auto"
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
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  {getStepIcon(5)}
                  <h3 className="text-lg font-medium">Paso 5: Optimizar Configuración</h3>
                </div>
                
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
                  className="w-full md:w-auto"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Optimizar para Producción
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BidirectionalSyncWizard;
