import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';

type EstadoNegocio = Database['public']['Enums']['estado_negocio'];

interface StageMapping {
  estado_negocio: EstadoNegocio;
  stage_id: string;
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
  const [saving, setSaving] = useState(false);
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
    } catch (error) {
      console.error('Error checking HubSpot config:', error);
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
        stage_id: ''
      };
      
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
        mapping.stage_id && mapping.stage_id.trim() !== ''
      );

      if (mappingsToInsert.length > 0) {
        const mappingsWithUserId = mappingsToInsert.map(mapping => ({
          estado_negocio: mapping.estado_negocio,
          stage_id: mapping.stage_id,
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
        <CardTitle>Mapeo de Estados con HubSpot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {ESTADOS_NEGOCIO.map(estado => (
            <div key={estado.value} className="flex items-center gap-3 p-2 border rounded-md">
              <div className="min-w-0 flex-1">
                <Label className="text-sm font-medium">{estado.label}</Label>
              </div>
              
              <div className="flex-1 max-w-xs">
                <Input
                  id={`stage-id-${estado.value}`}
                  value={mappings[estado.value]?.stage_id || ''}
                  onChange={(e) => handleMappingChange(estado.value, 'stage_id', e.target.value)}
                  placeholder="ID de etapa"
                  className="font-mono text-xs h-8"
                />
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
      </CardContent>
    </Card>
  );
};

export default SyncConfiguration;