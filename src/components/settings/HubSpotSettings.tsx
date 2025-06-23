
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useHubSpotData } from '@/hooks/useHubSpotData';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Settings, RefreshCw, AlertCircle } from 'lucide-react';

const HubSpotSettings = () => {
  const { config, loading, updateConfig } = useHubSpotConfig();
  const { pipelines, dealStages, loadingPipelines, loadingStages, fetchPipelines, fetchDealStages, clearStages } = useHubSpotData();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedPipelineId, setSelectedPipelineId] = useState(config?.default_pipeline_id || '');
  const [selectedDealStage, setSelectedDealStage] = useState(config?.default_deal_stage || '');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    if (config?.api_key_set) {
      fetchPipelines();
    }
  }, [config?.api_key_set]);

  useEffect(() => {
    setSelectedPipelineId(config?.default_pipeline_id || '');
    setSelectedDealStage(config?.default_deal_stage || '');
  }, [config]);

  useEffect(() => {
    if (selectedPipelineId && config?.api_key_set) {
      fetchDealStages(selectedPipelineId);
    } else {
      clearStages();
    }
  }, [selectedPipelineId, config?.api_key_set]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese una API key válida",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      console.log('Saving HubSpot API key as secret...');
      
      // Save API key as a Supabase secret through edge function
      const { data, error } = await supabase.functions.invoke('hubspot-sync', {
        body: { 
          action: 'save_api_key',
          apiKey: apiKey.trim()
        }
      });

      if (error) {
        console.error('Error saving API key:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Error saving API key');
      }

      console.log('API key saved successfully');

      // Update config to mark API key as set
      await updateConfig({
        api_key_set: true,
        default_pipeline_id: selectedPipelineId || undefined,
        default_deal_stage: selectedDealStage || undefined
      });

      setApiKey('');
      toast({
        title: "Configuración guardada",
        description: "La API key de HubSpot ha sido configurada correctamente"
      });

      // Fetch pipelines after successful save
      setTimeout(() => {
        fetchPipelines();
      }, 1000);

    } catch (error) {
      console.error('Error saving HubSpot config:', error);
      toast({
        title: "Error",
        description: `No se pudo guardar la configuración: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config?.api_key_set) {
      toast({
        title: "Error",
        description: "Primero configure la API key de HubSpot",
        variant: "destructive"
      });
      return;
    }

    setTestingConnection(true);
    try {
      console.log('Testing HubSpot connection...');
      
      const { data, error } = await supabase.functions.invoke('hubspot-sync', {
        body: { action: 'test_connection' }
      });

      if (error) {
        console.error('Connection test error:', error);
        throw error;
      }

      if (data.success) {
        toast({
          title: "Conexión exitosa",
          description: "La conexión con HubSpot funciona correctamente"
        });
        // Refresh pipelines after successful test
        fetchPipelines();
      } else {
        throw new Error(data.error || 'Error testing connection');
      }
    } catch (error) {
      console.error('Error testing HubSpot connection:', error);
      toast({
        title: "Error de conexión",
        description: `No se pudo conectar con HubSpot: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    await updateConfig({ auto_sync: enabled });
  };

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setSelectedDealStage(''); // Reset deal stage when pipeline changes
  };

  const handleUpdateConfiguration = async () => {
    await updateConfig({
      default_pipeline_id: selectedPipelineId || undefined,
      default_deal_stage: selectedDealStage || undefined
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Integración con HubSpot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Sincronización automática</Label>
              <p className="text-xs text-gray-500">
                Sincronizar automáticamente negocios con HubSpot
              </p>
            </div>
            <Switch
              checked={config?.auto_sync || false}
              onCheckedChange={handleToggleAutoSync}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Estado de la conexión</Label>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${config?.api_key_set ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {config?.api_key_set ? 'Conectado' : 'No conectado'}
              </span>
              {config?.api_key_set && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Probar Conexión'
                  )}
                </Button>
              )}
            </div>
          </div>

          {!config?.api_key_set && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Configurar HubSpot</h4>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key de HubSpot</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Ingrese su API key de HubSpot"
                />
                <p className="text-xs text-gray-500">
                  Puede obtener su API key desde{' '}
                  <a 
                    href="https://app.hubspot.com/settings/integrations/api-key" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    HubSpot Settings
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </p>
              </div>

              <Button onClick={handleSaveApiKey} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Configuración'
                )}
              </Button>
            </div>
          )}

          {config?.api_key_set && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-green-800">¡HubSpot conectado!</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPipelines}
                  disabled={loadingPipelines}
                >
                  {loadingPipelines ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-green-700">
                Los negocios se sincronizarán automáticamente con HubSpot cuando se creen o actualicen.
              </p>

              {pipelines.length === 0 && !loadingPipelines && (
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">No se pudieron cargar los pipelines. Verifique su API key.</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pipelineSelect">Pipeline</Label>
                  <Select
                    value={selectedPipelineId}
                    onValueChange={handlePipelineChange}
                    disabled={loadingPipelines || pipelines.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingPipelines 
                          ? "Cargando..." 
                          : pipelines.length === 0 
                          ? "No hay pipelines disponibles" 
                          : "Seleccionar pipeline"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stageSelect">Etapa del deal</Label>
                  <Select
                    value={selectedDealStage}
                    onValueChange={setSelectedDealStage}
                    disabled={!selectedPipelineId || loadingStages || dealStages.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={
                          !selectedPipelineId 
                            ? "Seleccione primero un pipeline" 
                            : loadingStages 
                            ? "Cargando..." 
                            : dealStages.length === 0
                            ? "No hay etapas disponibles"
                            : "Seleccionar etapa"
                        } 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {dealStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleUpdateConfiguration}
                variant="outline"
                disabled={!selectedPipelineId || !selectedDealStage}
              >
                Actualizar Configuración
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HubSpotSettings;
