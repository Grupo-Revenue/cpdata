
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, ExternalLink, Settings, Zap, ArrowLeftRight } from 'lucide-react';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useHubSpotData } from '@/hooks/useHubSpotData';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BidirectionalSyncSettings from './BidirectionalSyncSettings';

const HubSpotSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config, updateConfig, loading, reloadConfig } = useHubSpotConfig();
  const { pipelines, dealStages, fetchPipelines, fetchDealStages, clearStages, loadingPipelines, loadingStages, error, clearError } = useHubSpotData();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (config?.default_pipeline_id) {
      setSelectedPipeline(config.default_pipeline_id);
      fetchDealStages(config.default_pipeline_id);
    }
  }, [config]);

  useEffect(() => {
    if (config?.api_key_set) {
      fetchPipelines();
    }
  }, [config?.api_key_set]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese una API key",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save API key
      const { error } = await supabase
        .from('hubspot_api_keys')
        .upsert({
          user_id: user?.id,
          api_key: apiKey.trim()
        });

      if (error) throw error;

      // Update config to reflect API key is set
      await updateConfig({ api_key_set: true });

      setApiKey('');
      toast({
        title: "API Key guardada",
        description: "La API key de HubSpot se ha guardado correctamente"
      });

      // Fetch pipelines after saving API key
      fetchPipelines();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la API key",
        variant: "destructive"
      });
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    clearError();

    try {
      await fetchPipelines();
      if (error) {
        setConnectionStatus('error');
      } else {
        setConnectionStatus('success');
        toast({
          title: "Conexión exitosa",
          description: "La conexión con HubSpot se estableció correctamente"
        });
      }
    } catch (err) {
      setConnectionStatus('error');
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con HubSpot. Verifique su API key.",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handlePipelineChange = async (pipelineId: string) => {
    setSelectedPipeline(pipelineId);
    clearStages();
    
    if (pipelineId) {
      await fetchDealStages(pipelineId);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      await updateConfig({
        default_pipeline_id: selectedPipeline || null,
        default_deal_stage: config?.default_deal_stage || null
      });

      toast({
        title: "Configuración guardada",
        description: "La configuración se ha guardado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    }
  };

  const handleStageChange = async (stageId: string) => {
    try {
      await updateConfig({
        default_deal_stage: stageId
      });
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración de HubSpot</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Configuración Básica</TabsTrigger>
              <TabsTrigger value="bidirectional">Sincronización Bidireccional</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* API Key Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">API Key</h3>
                  {config?.api_key_set && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Configurada
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="api-key">HubSpot API Key</Label>
                    <div className="relative">
                      <Input
                        id="api-key"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={config?.api_key_set ? "API Key configurada" : "Ingrese su API key"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-end space-x-2">
                    <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                      Guardar API Key
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleTestConnection}
                      disabled={!config?.api_key_set || isTestingConnection}
                    >
                      {isTestingConnection ? "Probando..." : "Probar Conexión"}
                    </Button>
                  </div>
                </div>

                {connectionStatus && (
                  <Alert className={connectionStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <AlertDescription className={connectionStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
                      {connectionStatus === 'success' 
                        ? 'Conexión exitosa con HubSpot' 
                        : error || 'Error al conectar con HubSpot'
                      }
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-gray-600 space-y-1">
                  <p>Para obtener tu API key de HubSpot:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Ve a tu cuenta de HubSpot</li>
                    <li>Navega a Settings → Integrations → API key</li>
                    <li>Crea una nueva API key o copia una existente</li>
                    <li>Pégala en el campo de arriba</li>
                  </ol>
                  <a 
                    href="https://knowledge.hubspot.com/integrations/how-do-i-get-my-hubspot-api-key"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    Más información <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>

              <Separator />

              {/* Pipeline Configuration */}
              {config?.api_key_set && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configuración de Pipeline</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pipeline">Pipeline por Defecto</Label>
                      <Select 
                        value={selectedPipeline} 
                        onValueChange={handlePipelineChange}
                        disabled={loadingPipelines}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingPipelines ? "Cargando..." : "Seleccionar pipeline"} />
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
                      <Label htmlFor="stage">Etapa por Defecto</Label>
                      <Select 
                        value={config?.default_deal_stage || ''} 
                        onValueChange={handleStageChange}
                        disabled={!selectedPipeline || loadingStages}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingStages ? "Cargando..." : "Seleccionar etapa"} />
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="auto-sync">Sincronización Automática</Label>
                      <Switch
                        id="auto-sync"
                        checked={config?.auto_sync || false}
                        onCheckedChange={(checked) => updateConfig({ auto_sync: checked })}
                      />
                    </div>
                    <Button onClick={handleSaveConfiguration}>
                      Guardar Configuración
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bidirectional">
              <BidirectionalSyncSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubSpotSettings;
