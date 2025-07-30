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
    console.log('[CondicionesEditor] FormData:', formData);
    const cond = [];
    for (let i = 1; i <= 6; i++) {
      const value = formData[`condicion_comercial_${i}`];
      if (value && value.trim() !== '') {
        cond.push(value);
      }
    }
    // Always show at least one empty field for adding new conditions
    const result = cond.length === 0 ? [''] : [...cond, ''];
    console.log('[CondicionesEditor] Conditions array:', result);
    return result;
  }, [formData]);

  // Update individual database fields based on array
  const updateCondiciones = (newCondiciones: string[]) => {
    console.log('[CondicionesEditor] Updating conditions:', newCondiciones);
    
    // Filter out empty conditions for database update
    const filteredCond = newCondiciones.filter(cond => cond && cond.trim() !== '');
    
    // Update each condition field (clear first, then set)
    for (let i = 1; i <= 6; i++) {
      const newValue = filteredCond[i - 1] || '';
      onChange(`condicion_comercial_${i}`, newValue);
    }
  };

  const handleCondicionChange = (index: number, newValue: string) => {
    const newCondiciones = [...condiciones];
    newCondiciones[index] = newValue;
    updateCondiciones(newCondiciones);
  };

  const addCondicion = () => {
    console.log('[CondicionesEditor] Add condition clicked, current length:', condiciones.length);
    // Count non-empty conditions
    const nonEmptyCount = condiciones.filter(cond => cond && cond.trim() !== '').length;
    if (nonEmptyCount < 6) {
      const newCondiciones = [...condiciones];
      // Remove the last empty field and add a new empty one
      if (newCondiciones[newCondiciones.length - 1] === '') {
        newCondiciones.pop();
      }
      newCondiciones.push('', ''); // Add content field and new empty field
      updateCondiciones(newCondiciones);
    }
  };

  const removeCondicion = (index: number) => {
    console.log('[CondicionesEditor] Remove condition:', index);
    const newCondiciones = condiciones.filter((_, i) => i !== index);
    // Ensure we always have at least one empty field
    if (newCondiciones.length === 0 || newCondiciones[newCondiciones.length - 1] !== '') {
      newCondiciones.push('');
    }
    updateCondiciones(newCondiciones);
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
            disabled={condiciones.filter(cond => cond && cond.trim() !== '').length >= 6}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar condición ({condiciones.filter(cond => cond && cond.trim() !== '').length}/6)
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