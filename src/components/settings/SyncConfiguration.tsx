import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  { value: 'oportunidad_creada', label: 'Oportunidad Creada', colorClass: 'bg-business-oportunidad text-business-oportunidad-foreground' },
  { value: 'presupuesto_enviado', label: 'Presupuesto Enviado', colorClass: 'bg-business-presupuesto text-business-presupuesto-foreground' },
  { value: 'parcialmente_aceptado', label: 'Parcialmente Aceptado', colorClass: 'bg-business-parcial text-business-parcial-foreground' },
  { value: 'negocio_aceptado', label: 'Negocio Aceptado', colorClass: 'bg-business-aceptado text-business-aceptado-foreground' },
  { value: 'negocio_cerrado', label: 'Negocio Cerrado', colorClass: 'bg-business-cerrado text-business-cerrado-foreground' },
  { value: 'negocio_perdido', label: 'Negocio Perdido', colorClass: 'bg-business-perdido text-business-perdido-foreground' }
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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
          <div>Estado del Negocio</div>
          <div>ID de Etapa HubSpot</div>
        </div>
        
        <div className="space-y-3">
          {ESTADOS_NEGOCIO.map(estado => (
            <div key={estado.value} className="grid grid-cols-2 gap-4 items-center">
              <div className="flex items-center">
                <Badge 
                  variant="outline" 
                  className={`${estado.colorClass} text-xs px-3 py-1 min-w-[140px] justify-center`}
                >
                  {estado.label}
                </Badge>
              </div>
              
              <div>
                <Input
                  id={`stage-id-${estado.value}`}
                  value={mappings[estado.value]?.stage_id || ''}
                  onChange={(e) => handleMappingChange(estado.value, 'stage_id', e.target.value)}
                  placeholder="Ingresa el ID de etapa"
                  className="font-mono text-sm h-9"
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