
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { ProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';

interface QuoteEditViewProps {
  productos: ProductoPresupuesto[];
  onActualizarProducto: (id: string, campo: keyof ProductoPresupuesto, valor: any) => void;
  onEliminarProducto: (id: string) => void;
  onVolver: () => void;
  onConfirmar: () => void;
  total: number;
}

const QuoteEditView: React.FC<QuoteEditViewProps> = ({
  productos,
  onActualizarProducto,
  onEliminarProducto,
  onVolver,
  onConfirmar,
  total
}) => {
  const handlePrecioChange = (id: string, value: string) => {
    // Si el campo está vacío, mantenerlo vacío hasta que el usuario escriba algo
    if (value === '') {
      onActualizarProducto(id, 'precioUnitario', 0);
      return;
    }
    
    // Convertir a número, si no es válido usar 0
    const numeroValue = parseFloat(value);
    if (!isNaN(numeroValue)) {
      onActualizarProducto(id, 'precioUnitario', numeroValue);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onVolver}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Selección
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Presupuesto</h2>
            <p className="text-gray-600">Ajusta cantidades, precios y descripciones de los productos seleccionados</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total del Presupuesto</p>
          <p className="text-3xl font-bold text-green-600">{formatearPrecio(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de productos editables */}
        <div className="lg:col-span-2 space-y-4">
          {productos.map((producto) => (
            <Card key={producto.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg mb-2">{producto.nombre}</h4>
                    <div>
                      <Label className="text-sm font-medium">Descripción</Label>
                      <RichTextEditor
                        value={producto.descripcion}
                        onChange={(value) => onActualizarProducto(
                          producto.id, 
                          'descripcion', 
                          value
                        )}
                        placeholder="Descripción del producto..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEliminarProducto(producto.id)}
                    className="text-red-600 hover:text-red-700 ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={producto.cantidad}
                      onChange={(e) => onActualizarProducto(
                        producto.id, 
                        'cantidad', 
                        parseInt(e.target.value) || 1
                      )}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Precio Unitario (CLP)</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={producto.precioUnitario === 0 ? '' : producto.precioUnitario}
                      onChange={(e) => handlePrecioChange(producto.id, e.target.value)}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <span className="font-bold text-green-600">
                        {formatearPrecio(producto.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {productos.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos seleccionados</h3>
                <p className="text-gray-600 mb-4">Vuelve a la selección para agregar productos</p>
                <Button onClick={onVolver} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ir a Selección
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumen del presupuesto */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Resumen del Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Productos:</span>
                  <Badge variant="outline">{productos.length}</Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Cantidad total:</span>
                  <span>{productos.reduce((sum, p) => sum + p.cantidad, 0)}</span>
                </div>
                
                <hr />
                
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-xl text-green-600">
                    {formatearPrecio(total)}
                  </span>
                </div>
                
                <Button 
                  onClick={onConfirmar} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={productos.length === 0}
                >
                  Confirmar Presupuesto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuoteEditView;
