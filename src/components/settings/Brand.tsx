import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { supabase } from "@/integrations/supabase/client";
import { Upload, ImageIcon, Settings } from "lucide-react";
import { initializeBrandLogo } from "@/utils/initializeBrandLogo";

const Brand = () => {
  const { config, loading, forceRefresh } = useBrandConfig();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    email: '',
    telefono: '',
    sitio_web: '',
    direccion: '',
    color_primario: '#3B82F6',
    color_secundario: '#1E40AF'
  });

  React.useEffect(() => {
    if (config) {
      setFormData({
        nombre_empresa: config.nombre_empresa || '',
        email: config.email || '',
        telefono: config.telefono || '',
        sitio_web: config.sitio_web || '',
        direccion: config.direccion || '',
        color_primario: config.color_primario || '#3B82F6',
        color_secundario: config.color_secundario || '#1E40AF'
      });
    }
  }, [config]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona un archivo de imagen válido.',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El archivo es muy grande. Máximo 5MB.',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const fileName = `logo.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update database
      const { error: updateError } = await supabase
        .from('configuracion_marca')
        .update({ logo_url: fileName })
        .eq('id', config?.id);

      if (updateError) throw updateError;

      toast({
        title: 'Logo actualizado',
        description: 'El logo se ha subido correctamente.',
      });

      forceRefresh();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo subir el logo. Intenta nuevamente.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleInitializeLogo = async () => {
    try {
      setUploading(true);
      await initializeBrandLogo();
      
      toast({
        title: 'Logo inicializado',
        description: 'La configuración del logo se ha actualizado.',
      });
      
      forceRefresh();
    } catch (error) {
      console.error('Error initializing logo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo inicializar el logo.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('configuracion_marca')
        .update(formData)
        .eq('id', config?.id);

      if (error) throw error;

      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se han guardado correctamente.',
      });

      forceRefresh();
    } catch (error) {
      console.error('Error updating brand config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Marca</CardTitle>
        <CardDescription>
          Personaliza la marca y apariencia de tus documentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section */}
        <div className="space-y-4">
          <Label>Logo de la empresa</Label>
          <div className="flex items-center gap-4">
            {config?.logo_url ? (
              <div className="flex items-center gap-4">
                <img 
                  src={config.logo_url} 
                  alt="Logo actual" 
                  className="h-16 w-auto border rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="text-sm text-muted-foreground">
                  Logo actual
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
                <span>Sin logo configurado</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="hidden"
              id="logo-upload"
            />
            <Label htmlFor="logo-upload" asChild>
              <Button variant="outline" disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Subiendo...' : 'Subir nuevo logo'}
              </Button>
            </Label>
            <Button 
              variant="secondary" 
              onClick={handleInitializeLogo}
              disabled={uploading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Usar logo CP Data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Formatos soportados: JPG, PNG, SVG. Máximo 5MB.
          </p>
        </div>

        {/* Company Info Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_empresa">Nombre de la empresa</Label>
              <Input
                id="nombre_empresa"
                value={formData.nombre_empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_empresa: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sitio_web">Sitio web</Label>
              <Input
                id="sitio_web"
                value={formData.sitio_web}
                onChange={(e) => setFormData(prev => ({ ...prev, sitio_web: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color_primario">Color primario</Label>
              <div className="flex gap-2">
                <Input
                  id="color_primario"
                  type="color"
                  value={formData.color_primario}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_primario: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.color_primario}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_primario: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color_secundario">Color secundario</Label>
              <div className="flex gap-2">
                <Input
                  id="color_secundario"
                  type="color"
                  value={formData.color_secundario}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_secundario: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.color_secundario}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_secundario: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            Guardar configuración
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Brand;