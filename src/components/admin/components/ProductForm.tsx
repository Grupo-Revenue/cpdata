
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineaProducto, ProductFormData, Producto } from '../types/producto.types';

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  lineasProducto: LineaProducto[];
  editingProduct: Producto | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  formData,
  setFormData,
  lineasProducto,
  editingProduct,
  onSubmit,
  onCancel
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
          required
        />
      </div>
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <RichTextEditor
          value={formData.descripcion}
          onChange={(value) => setFormData({...formData, descripcion: value})}
          placeholder="Descripción del producto"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="precio_base">Precio Base (CLP) *</Label>
        <Input
          id="precio_base"
          type="number"
          step="1"
          value={formData.precio_base}
          onChange={(e) => setFormData({...formData, precio_base: e.target.value})}
          placeholder="Ej: 15000"
          required
        />
      </div>
      <div>
        <Label htmlFor="linea_producto">Línea de Producto</Label>
        <Select
          value={formData.linea_producto_id}
          onValueChange={(value) => setFormData({...formData, linea_producto_id: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar línea de producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin línea específica</SelectItem>
            {lineasProducto.map((linea) => (
              <SelectItem key={linea.id} value={linea.id}>
                {linea.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {editingProduct ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
