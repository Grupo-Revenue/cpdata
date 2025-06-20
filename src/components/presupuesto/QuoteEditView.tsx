
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { ShoppingCart, Trash2 } from 'lucide-react';
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
    if (value === '') {
      onActualizarProducto(id, 'precioUnitario', 0);
      return;
    }
    
    const numeroValue = parseFloat(value);
    if (!isNaN(numeroValue)) {
      onActualizarProducto(id, 'precioUnitario', numeroValue);
    }
  };

  if (productos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos seleccionados</h3>
            <p className="text-gray-600 mb-4">Vuelve a la selección para agregar productos</p>
            <Button onClick={onVolver} variant="outline">
              Ir a Selección
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Lista de productos editables - Tabla compacta */}
      <div className="xl:col-span-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Productos del Presupuesto</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[300px]">Producto</TableHead>
                    <TableHead className="w-[80px] text-center">Cant.</TableHead>
                    <TableHead className="w-[120px] text-center">Precio Unit.</TableHead>
                    <TableHead className="w-[120px] text-center">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((producto) => (
                    <TableRow key={producto.id} className="group">
                      <TableCell className="p-3">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{producto.nombre}</h4>
                          <div className="w-full">
                            <RichTextEditor
                              value={producto.descripcion}
                              onChange={(value) => onActualizarProducto(
                                producto.id, 
                                'descripcion', 
                                value
                              )}
                              placeholder="Descripción del producto..."
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 text-center">
                        <Input
                          type="number"
                          min="1"
                          value={producto.cantidad}
                          onChange={(e) => onActualizarProducto(
                            producto.id, 
                            'cantidad', 
                            parseInt(e.target.value) || 1
                          )}
                          className="w-16 h-8 text-center text-sm"
                        />
                      </TableCell>
                      <TableCell className="p-3 text-center">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          value={producto.precioUnitario === 0 ? '' : producto.precioUnitario}
                          onChange={(e) => handlePrecioChange(producto.id, e.target.value)}
                          className="w-24 h-8 text-center text-sm"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="p-3 text-center">
                        <span className="font-medium text-green-600 text-sm">
                          {formatearPrecio(producto.total)}
                        </span>
                      </TableCell>
                      <TableCell className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEliminarProducto(producto.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen del presupuesto - Sidebar compacto */}
      <div>
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Productos:</span>
              <Badge variant="outline" className="text-xs">{productos.length}</Badge>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cantidad total:</span>
              <span className="font-medium">{productos.reduce((sum, p) => sum + p.cantidad, 0)}</span>
            </div>
            
            <hr className="my-3" />
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-lg text-green-600">
                {formatearPrecio(total)}
              </span>
            </div>
            
            <Button 
              onClick={onConfirmar} 
              className="w-full bg-green-600 hover:bg-green-700 mt-4"
              disabled={productos.length === 0}
            >
              Confirmar Presupuesto
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuoteEditView;
