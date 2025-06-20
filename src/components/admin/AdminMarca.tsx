
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save, Loader2 } from 'lucide-react';

interface ConfiguracionMarca {
  id?: string;
  nombre_empresa: string;
  eslogan?: string;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  tipografia_principal: string;
  tipografia_secundaria: string;
}

const AdminMarca: React.FC = () => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionMarca>({
    nombre_empresa: '',
    eslogan: '',
    color_primario: '#000000',
    color_secundario: '#666666',
    color_acento: '#0066cc',
    tipografia_principal: 'Arial',
    tipografia_secundaria: 'Helvetica'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracion_marca')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfiguracion(data);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración de marca",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!configuracion.nombre_empresa) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es requerido",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('configuracion_marca')
        .upsert([configuracion], {
          onConflict: 'id'
        });

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: "La configuración de marca se actualizó correctamente"
      });
      
      cargarConfiguracion();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ConfiguracionMarca, value: string) => {
    setConfiguracion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Configuración de Marca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={guardarConfiguracion} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre_empresa">Nombre de la Empresa *</Label>
                  <Input
                    id="nombre_empresa"
                    value={configuracion.nombre_empresa}
                    onChange={(e) => handleChange('nombre_empresa', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="eslogan">Eslogan</Label>
                  <Input
                    id="eslogan"
                    value={configuracion.eslogan || ''}
                    onChange={(e) => handleChange('eslogan', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Colores */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Colores de Marca</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="color_primario">Color Primario</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="color_primario"
                      type="color"
                      value={configuracion.color_primario}
                      onChange={(e) => handleChange('color_primario', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={configuracion.color_primario}
                      onChange={(e) => handleChange('color_primario', e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="color_secundario">Color Secundario</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="color_secundario"
                      type="color"
                      value={configuracion.color_secundario}
                      onChange={(e) => handleChange('color_secundario', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={configuracion.color_secundario}
                      onChange={(e) => handleChange('color_secundario', e.target.value)}
                      placeholder="#666666"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="color_acento">Color de Acento</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="color_acento"
                      type="color"
                      value={configuracion.color_acento}
                      onChange={(e) => handleChange('color_acento', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={configuracion.color_acento}
                      onChange={(e) => handleChange('color_acento', e.target.value)}
                      placeholder="#0066cc"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tipografía */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tipografía</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipografia_principal">Tipografía Principal</Label>
                  <Input
                    id="tipografia_principal"
                    value={configuracion.tipografia_principal}
                    onChange={(e) => handleChange('tipografia_principal', e.target.value)}
                    placeholder="Arial, sans-serif"
                  />
                </div>
                <div>
                  <Label htmlFor="tipografia_secundaria">Tipografía Secundaria</Label>
                  <Input
                    id="tipografia_secundaria"
                    value={configuracion.tipografia_secundaria}
                    onChange={(e) => handleChange('tipografia_secundaria', e.target.value)}
                    placeholder="Helvetica, sans-serif"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Vista Previa</h3>
              <div 
                className="p-6 rounded-lg border-2"
                style={{
                  backgroundColor: configuracion.color_primario + '10',
                  borderColor: configuracion.color_acento,
                  fontFamily: configuracion.tipografia_principal
                }}
              >
                <h4 
                  className="text-2xl font-bold mb-2"
                  style={{ color: configuracion.color_primario }}
                >
                  {configuracion.nombre_empresa || 'Nombre de la Empresa'}
                </h4>
                {configuracion.eslogan && (
                  <p 
                    className="text-lg"
                    style={{ 
                      color: configuracion.color_secundario,
                      fontFamily: configuracion.tipografia_secundaria
                    }}
                  >
                    {configuracion.eslogan}
                  </p>
                )}
                <div className="mt-4 flex space-x-2">
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: configuracion.color_primario }}
                  ></div>
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: configuracion.color_secundario }}
                  ></div>
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: configuracion.color_acento }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarca;
