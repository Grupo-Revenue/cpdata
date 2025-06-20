
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomProductFormProps {
  onAgregarProducto: (producto: {
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }) => void;
}

const CustomProductForm: React.FC<CustomProductFormProps> = ({ onAgregarProducto }) => {
  const [producto, setProducto] = useState({
    nombre: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0
  });

  const handleSubmit = () => {
    if (!producto.nombre || producto.precioUnitario <= 0) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete el nombre y precio del producto",
        variant: "destructive"
      });
      return;
    }

    onAgregarProducto(producto);
    setProducto({
      nombre: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0
    });

    toast({
      title: "Producto agregado",
      description: `${producto.nombre} ha sido agregado al presupuesto`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Crear Producto Personalizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre del Producto *</Label>
            <Input
              id="nombre"
              value={producto.nombre}
              onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
              placeholder="Ingrese el nombre"
            />
          </div>
          <div>
            <Label htmlFor="precio">Precio Unitario (CLP) *</Label>
            <Input
              id="precio"
              type="number"
              step="1"
              min="0"
              value={producto.precioUnitario}
              onChange={(e) => setProducto({ 
                ...producto, 
                precioUnitario: parseFloat(e.target.value) || 0 
              })}
              placeholder="Ej: 15000"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            value={producto.descripcion}
            onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
            placeholder="Descripción del producto"
          />
        </div>
        
        <div>
          <Label htmlFor="cantidad">Cantidad</Label>
          <Input
            id="cantidad"
            type="number"
            min="1"
            value={producto.cantidad}
            onChange={(e) => setProducto({ 
              ...producto, 
              cantidad: parseInt(e.target.value) || 1 
            })}
          />
        </div>
        
        <Button 
          onClick={handleSubmit} 
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomProductForm;
