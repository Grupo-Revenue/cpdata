
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { ProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import EnhancedNumberInput from '@/components/ui/enhanced-number-input';
import AnimatedPrice from '@/components/ui/animated-price';
import EnhancedQuoteSummary from './EnhancedQuoteSummary';
import InlineAddProduct from './InlineAddProduct';

interface QuoteEditViewProps {
  productos: ProductoPresupuesto[];
  onActualizarProducto: (id: string, campo: keyof ProductoPresupuesto, valor: any) => void;
  onEliminarProducto: (id: string) => void;
  onAgregarProductoPersonalizado: (producto: {
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }) => void;
  onVolver: () => void;
  onConfirmar: () => void;
  total: number;
}

const QuoteEditView: React.FC<QuoteEditViewProps> = ({
  productos,
  onActualizarProducto,
  onEliminarProducto,
  onAgregarProductoPersonalizado,
  onVolver,
  onConfirmar,
  total
}) => {
  const [previousTotals, setPreviousTotals] = useState<Record<string, number>>({});
  const [previousGlobalTotal, setPreviousGlobalTotal] = useState<number>(total);

  const updateProductTotal = (id: string, newTotal: number) => {
    setPreviousTotals(prev => ({
      ...prev,
      [id]: productos.find(p => p.id === id)?.total || 0
    }));
    
    // Update global total
    setPreviousGlobalTotal(total);
  };

  const handleCantidadChange = (id: string, cantidad: number) => {
    const producto = productos.find(p => p.id === id);
    if (producto) {
      updateProductTotal(id, cantidad * producto.precioUnitario);
    }
    onActualizarProducto(id, 'cantidad', cantidad);
  };

  const handlePrecioChange = (id: string, precio: number) => {
    const producto = productos.find(p => p.id === id);
    if (producto) {
      updateProductTotal(id, precio * producto.cantidad);
    }
    onActualizarProducto(id, 'precioUnitario', precio);
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
      {/* Lista de productos editables */}
      <div className="xl:col-span-3 space-y-4">
        {/* Tabla de productos */}
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
                    <TableHead className="w-[100px] text-center">Cantidad</TableHead>
                    <TableHead className="w-[140px] text-center">Precio Unit.</TableHead>
                    <TableHead className="w-[140px] text-center">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((producto) => (
                    <TableRow key={producto.id} className="group">
                      <TableCell className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{producto.nombre}</h4>
                          <div className="w-full">
                            <Textarea
                              value={producto.descripcion}
                              onChange={(e) => onActualizarProducto(
                                producto.id, 
                                'descripcion', 
                                e.target.value
                              )}
                              placeholder="Descripción del producto..."
                              className="text-xs min-h-[60px] resize-none"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <EnhancedNumberInput
                          value={producto.cantidad}
                          onChange={(value) => handleCantidadChange(producto.id, value)}
                          min={1}
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <EnhancedNumberInput
                          value={producto.precioUnitario}
                          onChange={(value) => handlePrecioChange(producto.id, value)}
                          currency
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <AnimatedPrice
                          value={producto.total}
                          previousValue={previousTotals[producto.id]}
                          size="sm"
                          className="justify-center"
                        />
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEliminarProducto(producto.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
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

        {/* Componente para agregar productos inline */}
        <InlineAddProduct onAgregarProducto={onAgregarProductoPersonalizado} />
      </div>

      {/* Resumen mejorado del presupuesto */}
      <div>
        <EnhancedQuoteSummary
          productos={productos}
          total={total}
          previousTotal={previousGlobalTotal}
          onConfirmar={onConfirmar}
        />
      </div>
    </div>
  );
};

export default QuoteEditView;
