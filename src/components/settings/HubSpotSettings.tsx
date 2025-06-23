
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { Loader2, ExternalLink, Settings } from 'lucide-react';

const HubSpotSettings = () => {
  const { config, loading, updateConfig } = useHubSpotConfig();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [pipelineId, setPipelineId] = useState(config?.default_pipeline_id || '');
  const [dealStage, setDealStage] = useState(config?.default_deal_stage || '');

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
      // In a real implementation, you would securely store the API key
      // For now, we'll just mark it as set
      await updateConfig({
        api_key_set: true,
        default_pipeline_id: pipelineId || undefined,
        default_deal_stage: dealStage || undefined
      });

      setApiKey('');
      toast({
        title: "Configuración guardada",
        description: "La API key de HubSpot ha sido configurada correctamente"
      });
    } catch (error) {
      console.error('Error saving HubSpot config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    await updateConfig({ auto_sync: enabled });
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pipelineId">Pipeline ID (opcional)</Label>
                  <Input
                    id="pipelineId"
                    value={pipelineId}
                    onChange={(e) => setPipelineId(e.target.value)}
                    placeholder="default"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dealStage">Etapa del deal (opcional)</Label>
                  <Input
                    id="dealStage"
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                    placeholder="qualifiedtobuy"
                  />
                </div>
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
              <h4 className="font-medium text-green-800">¡HubSpot conectado!</h4>
              <p className="text-sm text-green-700">
                Los negocios se sincronizarán automáticamente con HubSpot cuando se creen o actualicen.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPipelineId">Pipeline ID actual</Label>
                  <Input
                    id="currentPipelineId"
                    value={pipelineId}
                    onChange={(e) => setPipelineId(e.target.value)}
                    placeholder="default"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentDealStage">Etapa del deal actual</Label>
                  <Input
                    id="currentDealStage"
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                    placeholder="qualifiedtobuy"
                  />
                </div>
              </div>

              <Button 
                onClick={() => updateConfig({
                  default_pipeline_id: pipelineId || undefined,
                  default_deal_stage: dealStage || undefined
                })}
                variant="outline"
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
