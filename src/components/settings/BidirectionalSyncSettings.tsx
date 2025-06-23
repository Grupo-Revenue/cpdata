
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  RefreshCw, 
  Settings, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  ArrowLeftRight,
  Zap
} from 'lucide-react';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useHubSpotData } from '@/hooks/useHubSpotData';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const BUSINESS_STATES = [
  { value: 'oportunidad_creada', label: 'Oportunidad Creada' },
  { value: 'presupuesto_enviado', label: 'Presupuesto Enviado' },
  { value: 'parcialmente_aceptado', label: 'Parcialmente Aceptado' },
  { value: 'negocio_aceptado', label: 'Negocio Aceptado' },
  { value: 'negocio_cerrado', label: 'Negocio Cerrado' },
  { value: 'negocio_perdido', label: 'Negocio Perdido' }
];

const CONFLICT_RESOLUTION_STRATEGIES = [
  { value: 'manual', label: 'Resolución Manual' },
  { value: 'hubspot_wins', label: 'HubSpot Gana' },
  { value: 'app_wins', label: 'Aplicación Gana' },
  { value: 'most_recent', label: 'Más Reciente Gana' }
];

const BidirectionalSyncSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config, updateConfig } = useHubSpotConfig();
  const { pipelines, dealStages, fetchPipelines, fetchDealStages, clearStages, loadingPipelines } = useHubSpotData();
  const {
    stateMappings,
    syncLogs,
    saveStateMapping,
    deleteStateMapping,
    pollHubSpotChanges,
    isPolling,
    loadStateMappings
  } = useBidirectionalSync();

  const [newMapping, setNewMapping] = useState({
    business_state: '',
    hubspot_pipeline_id: '',
    hubspot_stage_id: ''
  });
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [configForm, setConfigForm] = useState({
    bidirectional_sync: false,
    webhook_enabled: false,
    conflict_resolution_strategy: 'manual',
    polling_interval_minutes: 30
  });

  useEffect(() => {
    if (config) {
      setConfigForm({
        bidirectional_sync: config.bidirectional_sync || false,
        webhook_enabled: config.webhook_enabled || false,
        conflict_resolution_strategy: config.conflict_resolution_strategy || 'manual',
        polling_interval_minutes: config.polling_interval_minutes || 30
      });
    }
  }, [config]);

  const handleConfigUpdate = async () => {
    try {
      await updateConfig(configForm);
      toast({
        title: "Configuración actualizada",
        description: "La configuración de sincronización bidireccional se ha actualizado"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive"
      });
    }
  };

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
  };

  const getBusinessStateLabel = (state: string) => {
    return BUSINESS_STATES.find(s => s.value === state)?.label || state;
  };

  const getPipelineLabel = (pipelineId: string) => {
    return pipelines.find(p => p.id === pipelineId)?.label || pipelineId;
  };

  const getStageLabel = (stageId: string) => {
    return dealStages.find(s => s.id === stageId)?.label || stageId;
  };

  const formatSyncLogType = (type: string) => {
    const types = {
      'app_to_hubspot': 'App → HubSpot',
      'hubspot_to_app': 'HubSpot → App',
      'conflict_resolution': 'Resolución de Conflicto'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowLeftRight className="h-5 w-5" />
            <span>Sincronización Bidireccional</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Configuración</TabsTrigger>
              <TabsTrigger value="mappings">Mapeos de Estados</TabsTrigger>
              <TabsTrigger value="logs">Historial de Sync</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bidirectional-sync">Sincronización Bidireccional</Label>
                    <Switch
                      id="bidirectional-sync"
                      checked={configForm.bidirectional_sync}
                      onCheckedChange={(checked) => 
                        setConfigForm(prev => ({ ...prev, bidirectional_sync: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="webhook-enabled">Webhooks Habilitados</Label>
                    <Switch
                      id="webhook-enabled"
                      checked={configForm.webhook_enabled}
                      onCheckedChange={(checked) => 
                        setConfigForm(prev => ({ ...prev, webhook_enabled: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conflict-strategy">Estrategia de Resolución de Conflictos</Label>
                    <Select 
                      value={configForm.conflict_resolution_strategy}
                      onValueChange={(value) => 
                        setConfigForm(prev => ({ ...prev, conflict_resolution_strategy: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONFLICT_RESOLUTION_STRATEGIES.map(strategy => (
                          <SelectItem key={strategy.value} value={strategy.value}>
                            {strategy.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="polling-interval">Intervalo de Polling (minutos)</Label>
                    <Input
                      id="polling-interval"
                      type="number"
                      min="1"
                      max="1440"
                      value={configForm.polling_interval_minutes}
                      onChange={(e) => 
                        setConfigForm(prev => ({ 
                          ...prev, 
                          polling_interval_minutes: parseInt(e.target.value) || 30 
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Acciones Rápidas</span>
                    </h4>
                    
                    <Button 
                      onClick={pollHubSpotChanges}
                      disabled={isPolling}
                      className="w-full"
                      variant="outline"
                    >
                      {isPolling ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {isPolling ? 'Sincronizando...' : 'Sincronizar Ahora'}
                    </Button>

                    <Button 
                      onClick={fetchPipelines}
                      disabled={loadingPipelines}
                      className="w-full"
                      variant="outline"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Recargar Pipelines
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleConfigUpdate}>
                  Guardar Configuración
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="mappings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agregar Nuevo Mapeo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Estado del Negocio</Label>
                      <Select 
                        value={newMapping.business_state}
                        onValueChange={(value) => 
                          setNewMapping(prev => ({ ...prev, business_state: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_STATES.map(state => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Pipeline de HubSpot</Label>
                      <Select 
                        value={selectedPipeline}
                        onValueChange={handlePipelineChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar pipeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {pipelines.map(pipeline => (
                            <SelectItem key={pipeline.id} value={pipeline.id}>
                              {pipeline.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Etapa de HubSpot</Label>
                      <Select 
                        value={newMapping.hubspot_stage_id}
                        onValueChange={(value) => 
                          setNewMapping(prev => ({ ...prev, hubspot_stage_id: value }))
                        }
                        disabled={!selectedPipeline}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar etapa" />
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
                  </div>

                  <Button onClick={handleAddMapping} className="w-full md:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Mapeo
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mapeos Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {stateMappings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay mapeos configurados
                    </div>
                  ) : (
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
                              <Badge variant="outline">
                                {getBusinessStateLabel(mapping.business_state)}
                              </Badge>
                            </TableCell>
                            <TableCell>{getPipelineLabel(mapping.hubspot_pipeline_id)}</TableCell>
                            <TableCell>{getStageLabel(mapping.hubspot_stage_id)}</TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar mapeo?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. El mapeo será eliminado permanentemente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteStateMapping(mapping.id)}
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historial de Sincronización</CardTitle>
                </CardHeader>
                <CardContent>
                  {syncLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay registros de sincronización
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Cambios</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {formatSyncLogType(log.operation_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {log.success ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Exitoso
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Error
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {log.old_state && log.new_state && (
                                <div className="text-sm">
                                  <span className="text-gray-500">{log.old_state}</span>
                                  <span className="mx-2">→</span>
                                  <span className="font-medium">{log.new_state}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {log.error_message && (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs">{log.error_message}</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BidirectionalSyncSettings;
