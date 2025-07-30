import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useBudgetTermsConfig, BudgetTermsConfig } from '@/hooks/useBudgetTermsConfig';
import { Loader2, Save } from 'lucide-react';
import ListEditor from './components/ListEditor';
import ObservacionesEditor from './components/ObservacionesEditor';
import CondicionesEditor from './components/CondicionesEditor';

const AdminTermsConfig: React.FC = () => {
  const { config, loading, error, updateConfig } = useBudgetTermsConfig();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<BudgetTermsConfig>>(config || {});

  React.useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateConfig(formData);
    
    if (success) {
      toast.success('Configuración de términos actualizada correctamente');
    } else {
      toast.error('Error al actualizar la configuración');
    }
    setSaving(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando configuración...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Configuración de Términos y Condiciones</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Condiciones Comerciales</CardTitle>
        </CardHeader>
        <CardContent>
          <CondicionesEditor
            formData={formData}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ObservacionesEditor
            formData={formData}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Términos y Condiciones del Pie de Página</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="certificacion_texto">Texto de Certificación</Label>
            <Input
              id="certificacion_texto"
              value={formData.certificacion_texto || ''}
              onChange={(e) => handleChange('certificacion_texto', e.target.value)}
              placeholder="Empresa certificada en normas ISO 9001:2015..."
            />
          </div>
          <div>
            <Label htmlFor="documento_texto">Texto del Documento</Label>
            <Input
              id="documento_texto"
              value={formData.documento_texto || ''}
              onChange={(e) => handleChange('documento_texto', e.target.value)}
              placeholder="Este documento constituye una propuesta comercial..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTermsConfig;