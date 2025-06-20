
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
  telefono?: string;
  email?: string;
  sitio_web?: string;
  direccion?: string;
  color_primario: string;
  color_secundario: string;
  logo_url?: string;
}

const AdminMarca: React.FC = () => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionMarca>({
    nombre_empresa: '',
    telefono: '',
    email: '',
    sitio_web: '',
    direccion: '',
    color_primario: '#3B82F6',
    color_secundario: '#1E40AF',
    logo_url: ''
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
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={configuracion.telefono || ''}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={configuracion.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sitio_web">Sitio Web</Label>
                  <Input
                    id="sitio_web"
                    value={configuracion.sitio_web || ''}
                    onChange={(e) => handleChange('sitio_web', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  value={configuracion.direccion || ''}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                />
              </div>
            </div>

            {/* Colores */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Colores de Marca</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="#3B82F6"
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
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vista Previa */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Vista Previa</h3>
              <div 
                className="p-6 rounded-lg border-2"
                style={{
                  backgroundColor: configuracion.color_primario + '10',
                  borderColor: configuracion.color_secundario
                }}
              >
                <h4 
                  className="text-2xl font-bold mb-2"
                  style={{ color: configuracion.color_primario }}
                >
                  {configuracion.nombre_empresa || 'Nombre de la Empresa'}
                </h4>
                {configuracion.email && (
                  <p 
                    className="text-lg mb-1"
                    style={{ color: configuracion.color_secundario }}
                  >
                    {configuracion.email}
                  </p>
                )}
                {configuracion.telefono && (
                  <p 
                    className="text-lg mb-1"
                    style={{ color: configuracion.color_secundario }}
                  >
                    {configuracion.telefono}
                  </p>
                )}
                {configuracion.direccion && (
                  <p 
                    className="text-sm"
                    style={{ color: configuracion.color_secundario }}
                  >
                    {configuracion.direccion}
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
