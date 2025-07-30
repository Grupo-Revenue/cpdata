import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface ObservacionesEditorProps {
  formData: any;
  onChange: (field: string, value: string) => void;
}

const ObservacionesEditor: React.FC<ObservacionesEditorProps> = ({
  formData,
  onChange
}) => {
  const [showPreview, setShowPreview] = React.useState(false);
  
  // Convert individual observacion fields to array for editing
  const observations = React.useMemo(() => {
    console.log('[ObservacionesEditor] FormData:', formData);
    const obs = [];
    for (let i = 1; i <= 6; i++) {
      const value = formData[`observacion_${i}`];
      if (value && value.trim() !== '') {
        obs.push(value);
      }
    }
    // Always show at least one empty field for adding new observations
    const result = obs.length === 0 ? [''] : [...obs, ''];
    console.log('[ObservacionesEditor] Observations array:', result);
    return result;
  }, [formData]);

  // Update individual database fields based on array
  const updateObservations = (newObservations: string[]) => {
    console.log('[ObservacionesEditor] Updating observations:', newObservations);
    
    // Filter out empty observations for database update
    const filteredObs = newObservations.filter(obs => obs && obs.trim() !== '');
    
    // Update each observation field (clear first, then set)
    for (let i = 1; i <= 6; i++) {
      const newValue = filteredObs[i - 1] || '';
      onChange(`observacion_${i}`, newValue);
    }
  };

  const handleObservationChange = (index: number, newValue: string) => {
    const newObservations = [...observations];
    newObservations[index] = newValue;
    updateObservations(newObservations);
  };

  const addObservation = () => {
    console.log('[ObservacionesEditor] Add observation clicked, current length:', observations.length);
    // Count non-empty observations
    const nonEmptyCount = observations.filter(obs => obs && obs.trim() !== '').length;
    if (nonEmptyCount < 6) {
      const newObservations = [...observations];
      // Remove the last empty field and add a new empty one
      if (newObservations[newObservations.length - 1] === '') {
        newObservations.pop();
      }
      newObservations.push('', ''); // Add content field and new empty field
      updateObservations(newObservations);
    }
  };

  const removeObservation = (index: number) => {
    console.log('[ObservacionesEditor] Remove observation:', index);
    const newObservations = observations.filter((_, i) => i !== index);
    // Ensure we always have at least one empty field
    if (newObservations.length === 0 || newObservations[newObservations.length - 1] !== '') {
      newObservations.push('');
    }
    updateObservations(newObservations);
  };

  const nonEmptyObservations = observations.filter(obs => obs.trim() !== '');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Observaciones</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Agregue observaciones importantes para el presupuesto (máximo 6)
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
              {nonEmptyObservations.length > 0 ? (
                nonEmptyObservations.map((obs, index) => (
                  <p key={index} className="text-sm text-gray-700">
                    {index + 1}. {obs}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No hay observaciones para mostrar</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {observations.map((observation, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                    Observación {index + 1}:
                  </span>
                  <Input
                    value={observation}
                    onChange={(e) => handleObservationChange(index, e.target.value)}
                    placeholder={`Observación ${index + 1}`}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeObservation(index)}
                disabled={observations.length === 1}
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
            onClick={addObservation}
            disabled={observations.filter(obs => obs && obs.trim() !== '').length >= 6}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar observación ({observations.filter(obs => obs && obs.trim() !== '').length}/6)
          </Button>
          
          <div className="text-xs text-muted-foreground">
            💡 Las observaciones aparecerán numeradas automáticamente en el PDF
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservacionesEditor;