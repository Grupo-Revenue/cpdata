import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';

interface HubSpotPipeline {
  id: string;
  name: string;
  stages: HubSpotStage[];
}

interface HubSpotStage {
  id: string;
  name: string;
}

type EstadoNegocio = Database['public']['Enums']['estado_negocio'];

interface StageMapping {
  estado_negocio: EstadoNegocio;
  hubspot_pipeline_id: string;
  hubspot_stage_id: string;
  hubspot_stage_name: string;
  user_id?: string;
}

const ESTADOS_NEGOCIO = [
  { value: 'oportunidad_creada', label: 'Oportunidad Creada' },
  { value: 'presupuesto_enviado', label: 'Presupuesto Enviado' },
  { value: 'parcialmente_aceptado', label: 'Parcialmente Aceptado' },
  { value: 'negocio_aceptado', label: 'Negocio Aceptado' },
  { value: 'negocio_cerrado', label: 'Negocio Cerrado' },
  { value: 'negocio_perdido', label: 'Negocio Perdido' }
];

const SyncConfiguration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pipelines, setPipelines] = useState<HubSpotPipeline[]>([]);
  const [mappings, setMappings] = useState<Record<string, StageMapping>>({});
  const [hasHubSpotConfig, setHasHubSpotConfig] = useState(false);

  useEffect(() => {
    checkHubSpotConfiguration();
    loadExistingMappings();
  }, []);

  const checkHubSpotConfiguration = async () => {
    try {
      const { data } = await supabase
        .from('hubspot_api_keys')
        .select('*')
        .eq('activo', true)
        .single();
      
      setHasHubSpotConfig(!!data);
      
      if (data) {
        loadPipelines();
      }
    } catch (error) {
      console.error('Error checking HubSpot config:', error);
    }
  };

  const loadPipelines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('hubspot-pipelines', {
        method: 'GET'
      });

      if (error) throw error;
      
      setPipelines(data.pipelines || []);
    } catch (error) {
      console.error('Error loading pipelines:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pipelines de HubSpot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('hubspot_stage_mapping')
        .select('*');

      if (error) throw error;

      const mappingsMap: Record<string, StageMapping> = {};
      data?.forEach(mapping => {
        mappingsMap[mapping.estado_negocio] = mapping;
      });
      
      setMappings(mappingsMap);
    } catch (error) {
      console.error('Error loading mappings:', error);
    }
  };

  const handleMappingChange = (estadoNegocio: string, field: string, value: string) => {
    setMappings(prev => {
      const currentMapping = prev[estadoNegocio] || {
        estado_negocio: estadoNegocio as EstadoNegocio,
        hubspot_pipeline_id: '',
        hubspot_stage_id: '',
        hubspot_stage_name: ''
      };
      
      if (field === 'hubspot_stage_id') {
        // Find the stage name
        let stageName = '';
        for (const pipeline of pipelines) {
          const stage = pipeline.stages.find(s => s.id === value);
          if (stage) {
            stageName = stage.name;
            break;
          }
        }
        
        return {
          ...prev,
          [estadoNegocio]: {
            ...currentMapping,
            estado_negocio: estadoNegocio as EstadoNegocio,
            hubspot_stage_id: value,
            hubspot_stage_name: stageName,
            hubspot_pipeline_id: currentMapping.hubspot_pipeline_id
          }
        };
      }
      
      return {
        ...prev,
        [estadoNegocio]: {
          ...currentMapping,
          estado_negocio: estadoNegocio as EstadoNegocio,
          [field]: value
        }
      };
    });
  };

  const getStagesForPipeline = (pipelineId: string): HubSpotStage[] => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    return pipeline?.stages || [];
  };

  const saveMappings = async () => {
    try {
      setSaving(true);
      
      // Delete existing mappings
      await supabase
        .from('hubspot_stage_mapping')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Insert new mappings
      const mappingsToInsert = Object.values(mappings).filter(mapping => 
        mapping.hubspot_pipeline_id && mapping.hubspot_stage_id
      );

      if (mappingsToInsert.length > 0) {
        const mappingsWithUserId = mappingsToInsert.map(mapping => ({
          ...mapping,
          user_id: undefined // Will be set by RLS
        }));
        
        const { error } = await supabase
          .from('hubspot_stage_mapping')
          .insert(mappingsWithUserId);

        if (error) throw error;
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración de sincronización se ha guardado correctamente"
      });
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!hasHubSpotConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Sincronización</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Para configurar la sincronización, primero necesitas configurar HubSpot en la pestaña correspondiente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Mapeo de Estados con HubSpot
          <Button
            variant="outline"
            size="sm"
            onClick={loadPipelines}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Actualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando pipelines de HubSpot...
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {ESTADOS_NEGOCIO.map(estado => (
                <div key={estado.value} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Label className="font-medium">{estado.label}</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor={`pipeline-${estado.value}`} className="text-sm">Pipeline</Label>
                    <Select
                      value={mappings[estado.value]?.hubspot_pipeline_id || ''}
                      onValueChange={(value) => handleMappingChange(estado.value, 'hubspot_pipeline_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelines.map(pipeline => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`stage-${estado.value}`} className="text-sm">Etapa</Label>
                    <Select
                      value={mappings[estado.value]?.hubspot_stage_id || ''}
                      onValueChange={(value) => handleMappingChange(estado.value, 'hubspot_stage_id', value)}
                      disabled={!mappings[estado.value]?.hubspot_pipeline_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {getStagesForPipeline(mappings[estado.value]?.hubspot_pipeline_id || '').map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={saveMappings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncConfiguration;