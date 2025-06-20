
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { ShoppingCart, Trash2, DollarSign, Percent, ArrowLeft } from 'lucide-react';
import { ProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularTotalesPresupuesto } from '@/utils/quoteCalculations';

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
  const formatearNumeroConSeparadores = (numero: number): string => {
    return new Intl.NumberFormat('es-CL').format(numero);
  };

  const parsearNumeroConSeparadores = (valor: string): number => {
    // Remover puntos separadores de miles y convertir a número
    const numeroLimpio = valor.replace(/\./g, '');
    return parseInt(numeroLimpio) || 0;
  };

  const handlePrecioChange = (id: string, value: string) => {
    // Solo permitir números y puntos
    const valorLimpio = value.replace(/[^\d.]/g, '');
    
    if (valorLimpio === '') {
      onActualizarProducto(id, 'precioUnitario', 0);
      return;
    }
    
    const numeroValue = parsearNumeroConSeparadores(valorLimpio);
    if (!isNaN(numeroValue)) {
      onActualizarProducto(id, 'precioUnitario', numeroValue);
    }
  };

  const handlePrecioKeyPress = (e: React.KeyboardEvent) => {
    // Prevenir letras y símbolos excepto números y puntos
    if (!/[\d.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleDescuentoChange = (id: string, value: string) => {
    const numeroValue = parseFloat(value) || 0;
    // Limitar descuento entre 0 y 100
    const descuentoLimitado = Math.max(0, Math.min(100, numeroValue));
    onActualizarProducto(id, 'descuentoPorcentaje', descuentoLimitado);
  };

  const totales = calcularTotalesPresupuesto(productos);

  if (productos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos seleccionados</h3>
            <p className="text-gray-600 mb-4">Vuelve a la selección para agregar productos</p>
            <Button onClick={onVolver} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Selección
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
                    <TableHead className="w-[280px]">Producto</TableHead>
                    <TableHead className="w-[70px] text-center">Cant.</TableHead>
                    <TableHead className="w-[110px] text-center">Precio Unit.</TableHead>
                    <TableHead className="w-[90px] text-center">Desc. %</TableHead>
                    <TableHead className="w-[110px] text-center">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((producto, index) => (
                    <TableRow key={producto.id} className="group">
                      <TableCell className="p-3">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mr-2">
                              {index + 1}
                            </span>
                            {producto.nombre}
                          </h4>
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
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500" />
                          <Input
                            type="text"
                            value={producto.precioUnitario === 0 ? '' : formatearNumeroConSeparadores(producto.precioUnitario)}
                            onChange={(e) => handlePrecioChange(producto.id, e.target.value)}
                            onKeyDown={handlePrecioKeyPress}
                            className="w-26 h-8 text-center text-sm pl-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                            style={{ MozAppearance: 'textfield' }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="p-3 text-center">
                        <div className="relative">
                          <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500" />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={producto.descuentoPorcentaje}
                            onChange={(e) => handleDescuentoChange(producto.id, e.target.value)}
                            className="w-20 h-8 text-center text-sm pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                            style={{ MozAppearance: 'textfield' }}
                          />
                        </div>
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
              Resumen del Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Productos:</span>
              <Badge variant="outline" className="text-xs">{productos.length}</Badge>
            </div>
            
            <hr className="my-3" />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatearPrecio(totales.subtotal)}</span>
              </div>
              
              {totales.totalDescuentos > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Descuentos:</span>
                  <span className="font-medium text-red-600">-{formatearPrecio(totales.totalDescuentos)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal c/desc:</span>
                <span className="font-medium">{formatearPrecio(totales.subtotalConDescuento)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">IVA (19%):</span>
                <span className="font-medium">{formatearPrecio(totales.iva)}</span>
              </div>
            </div>
            
            <hr className="my-3" />
            
            <div className="flex justify-between items-center">
              <span className="font-semibold text-base">Total Final:</span>
              <span className="font-bold text-xl text-green-600">
                {formatearPrecio(totales.total)}
              </span>
            </div>
            
            <div className="space-y-2 mt-6">
              <Button 
                onClick={onConfirmar} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={productos.length === 0}
                size="lg"
              >
                Guardar Presupuesto
              </Button>
              
              <Button 
                onClick={onVolver}
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Agregar más productos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuoteEditView;
