import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface CondicionesEditorProps {
  formData: any;
  onChange: (field: string, value: string) => void;
}

const CondicionesEditor: React.FC<CondicionesEditorProps> = ({
  formData,
  onChange
}) => {
  const [showPreview, setShowPreview] = React.useState(false);
  
  // Convert individual condicion fields to array for editing
  const condiciones = React.useMemo(() => {
    const cond = [];
    for (let i = 1; i <= 6; i++) {
      const value = formData[`condicion_comercial_${i}`];
      if (value && value.trim() !== '') {
        cond.push(value);
      }
    }
    // Always show at least one empty field if no conditions exist
    return cond.length === 0 ? [''] : cond;
  }, [formData]);

  // Update individual database fields based on array
  const updateCondiciones = (newCondiciones: string[]) => {
    // Clear all existing conditions first
    for (let i = 1; i <= 6; i++) {
      onChange(`condicion_comercial_${i}`, '');
    }
    
    // Set the new conditions (filtered to remove empty ones)
    const filteredCond = newCondiciones.filter(cond => cond.trim() !== '');
    filteredCond.forEach((cond, index) => {
      if (index < 6) { // Limit to 6 conditions
        onChange(`condicion_comercial_${index + 1}`, cond);
      }
    });
  };

  const handleCondicionChange = (index: number, newValue: string) => {
    const newCondiciones = [...condiciones];
    newCondiciones[index] = newValue;
    updateCondiciones(newCondiciones);
  };

  const addCondicion = () => {
    if (condiciones.length < 6) {
      updateCondiciones([...condiciones, '']);
    }
  };

  const removeCondicion = (index: number) => {
    if (condiciones.length > 1) {
      const newCondiciones = condiciones.filter((_, i) => i !== index);
      updateCondiciones(newCondiciones);
    }
  };

  const nonEmptyCondiciones = condiciones.filter(cond => cond.trim() !== '');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Condiciones Comerciales</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Configure las condiciones comerciales para los presupuestos (máximo 6)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Editar' : 'Vista Previa'}
          </Button>
        </div>
      </div>

      {showPreview ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vista Previa (Como aparecerá en el PDF)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 p-4 bg-gray-50 rounded-md">
              {nonEmptyCondiciones.length > 0 ? (
                nonEmptyCondiciones.map((cond, index) => (
                  <p key={index} className="text-sm text-gray-700">
                    • {cond}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No hay condiciones comerciales para mostrar</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {condiciones.map((condicion, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                    Condición {index + 1}:
                  </span>
                  <Input
                    value={condicion}
                    onChange={(e) => handleCondicionChange(index, e.target.value)}
                    placeholder={`Condición comercial ${index + 1}`}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeCondicion(index)}
                disabled={condiciones.length === 1}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCondicion}
            disabled={condiciones.length >= 6}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar condición ({condiciones.length}/6)
          </Button>
          
          <div className="text-xs text-muted-foreground">
            💡 Las condiciones aparecerán con viñetas automáticamente en el PDF
          </div>
        </div>
      )}
    </div>
  );
};

export default CondicionesEditor;