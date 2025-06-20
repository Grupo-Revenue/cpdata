
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Check } from 'lucide-react';
import { ProductoPresupuesto } from '@/types';
import EnhancedNumberInput from '@/components/ui/enhanced-number-input';

interface InlineAddProductProps {
  onAgregarProducto: (producto: {
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }) => void;
}

const InlineAddProduct: React.FC<InlineAddProductProps> = ({ onAgregarProducto }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nombre.trim() && formData.precioUnitario > 0) {
      onAgregarProducto(formData);
      setFormData({
        nombre: '',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0
      });
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0
    });
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <div className="flex justify-center py-4">
        <Button
          onClick={() => setIsAdding(true)}
          variant="outline"
          className="border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto Personalizado
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">Nuevo Producto</h4>
            <Button
              type="button"
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Nombre del producto"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
                className="bg-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <Textarea
                placeholder="Descripción (opcional)"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="bg-white min-h-[60px]"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Cantidad
              </label>
              <EnhancedNumberInput
                value={formData.cantidad}
                onChange={(value) => setFormData(prev => ({ ...prev, cantidad: value }))}
                min={1}
                className="bg-white"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Precio Unitario
              </label>
              <EnhancedNumberInput
                value={formData.precioUnitario}
                onChange={(value) => setFormData(prev => ({ ...prev, precioUnitario: value }))}
                currency
                className="bg-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!formData.nombre.trim() || formData.precioUnitario <= 0}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InlineAddProduct;
