import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface ListEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}

const ListEditor: React.FC<ListEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = "Nuevo punto",
  description
}) => {
  const [showPreview, setShowPreview] = React.useState(false);
  
  // Convert string with \n to array for editing
  const items = React.useMemo(() => {
    if (!value) return [''];
    return value.split(/\\n|\r?\n/).filter(item => item.trim() !== '');
  }, [value]);

  // Convert array back to string with \n for database
  const updateValue = (newItems: string[]) => {
    const filteredItems = newItems.filter(item => item.trim() !== '');
    onChange(filteredItems.join('\\n'));
  };

  const handleItemChange = (index: number, newValue: string) => {
    const newItems = [...items];
    newItems[index] = newValue;
    updateValue(newItems);
  };

  const addItem = () => {
    updateValue([...items, '']);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      updateValue(newItems);
    }
  };

  const formatPreviewText = (text: string) => {
    return text.split(/\\n|\r?\n/)
      .filter(line => line.trim() !== '')
      .map(line => line.startsWith('•') ? line : `• ${line}`)
      .join('\n');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">{label}</Label>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
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
              {value ? (
                formatPreviewText(value).split('\n').map((line, index) => (
                  <p key={index} className="text-sm text-gray-700">
                    {line}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No hay contenido para mostrar</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={placeholder}
                  className="pr-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
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
            onClick={addItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar punto
          </Button>
          
          <div className="text-xs text-muted-foreground">
            💡 Cada línea será un punto separado en el PDF con viñetas automáticas
          </div>
        </div>
      )}
    </div>
  );
};

export default ListEditor;