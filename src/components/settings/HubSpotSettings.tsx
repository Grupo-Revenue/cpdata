
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { useHubSpotData } from '@/hooks/useHubSpotData';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const HubSpotSettings = () => {
  const { toast } = useToast();
  const { config, loading, updateConfig } = useHubSpotConfig();
  const { pipelines, dealStages, loadingPipelines, loadingStages, fetchPipelines, fetchDealStages, clearStages } = useHubSpotData();
  
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una API key válida",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      console.log('Saving HubSpot API key...');
      
      const { data, error } = await supabase.functions.invoke('hubspot-sync', {
        body: { 
          action: 'save_api_key',
          apiKey: apiKey.trim()
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('API key save response:', data);

      if (data.success) {
        await updateConfig({ 
          api_key_set: true 
        });
        
        setApiKey('');
        setConnectionStatus('idle');
        
        toast({
          title: "API Key guardada",
          description: "La API key de HubSpot se ha guardado correctamente"
        });
      } else {
        throw new Error(data.error || 'Error desconocido al guardar la API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: `No se pudo guardar la API key: ${error.message}`,
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
        description: "Primero debes configurar tu API key de HubSpot",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setConnectionStatus('idle');
    
    try {
      console.log('Testing HubSpot connection...');
      
      const { data, error } = await supabase.functions.invoke('hubspot-sync', {
        body: { action: 'test_connection' }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Connection test response:', data);

      if (data.success) {
        setConnectionStatus('success');
        toast({
          title: "Conexión exitosa",
          description: "La conexión con HubSpot ha sido verificada correctamente"
        });
      } else {
        setConnectionStatus('error');
        throw new Error(data.error || 'Error en la prueba de conexión');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus('error');
      toast({
        title: "Error de conexión",
        description: `No se pudo conectar con HubSpot: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLoadPipelines = async () => {
    if (!config?.api_key_set) {
      toast({
        title: "Error",
        description: "Primero debes configurar tu API key de HubSpot",
        variant: "destructive"
      });
      return;
    }

    await fetchPipelines();
  };

  const handlePipelineChange = async (pipelineId: string) => {
    await updateConfig({ default_pipeline_id: pipelineId });
    clearStages();
    
    if (pipelineId) {
      await fetchDealStages(pipelineId);
    }
  };

  const handleDealStageChange = async (stageId: string) => {
    await updateConfig({ default_deal_stage: stageId });
  };

  const handleAutoSyncChange = async (enabled: boolean) => {
    await updateConfig({ auto_sync: enabled });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración de HubSpot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Key de HubSpot</CardTitle>
          <CardDescription>
            Configura tu API key de HubSpot para sincronizar tus negocios automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                placeholder={config?.api_key_set ? "API key configurada" : "Ingresa tu API key de HubSpot"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={saving}
              />
              <Button 
                onClick={handleSaveApiKey}
                disabled={saving || !apiKey.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </div>

          {config?.api_key_set && (
            <div className="flex items-center gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Probando...
                  </>
                ) : (
                  'Probar Conexión'
                )}
              </Button>
              
              {connectionStatus === 'success' && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Conexión exitosa</span>
                </div>
              )}
              
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Error de conexión</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {config?.api_key_set && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Sincronización</CardTitle>
            <CardDescription>
              Configura cómo se sincronizan tus negocios con HubSpot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoSync">Sincronización Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Sincroniza automáticamente los negocios cuando se crean o actualizan
                </p>
              </div>
              <Switch
                id="autoSync"
                checked={config?.auto_sync || false}
                onCheckedChange={handleAutoSyncChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Pipeline por Defecto</Label>
              <div className="flex gap-2">
                <Select 
                  value={config?.default_pipeline_id || ''} 
                  onValueChange={handlePipelineChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={handleLoadPipelines}
                  disabled={loadingPipelines}
                >
                  {loadingPipelines ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Cargar'
                  )}
                </Button>
              </div>
            </div>

            {config?.default_pipeline_id && (
              <div className="space-y-2">
                <Label>Etapa por Defecto</Label>
                <Select 
                  value={config?.default_deal_stage || ''} 
                  onValueChange={handleDealStageChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingStages ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Cargando etapas...
                      </SelectItem>
                    ) : (
                      dealStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HubSpotSettings;
