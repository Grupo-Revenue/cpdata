
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowRight, Package } from 'lucide-react';
import { ProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularTotalesPresupuesto } from '@/utils/quoteCalculations';

interface ProductSelectionSidebarProps {
  productosSeleccionados: ProductoPresupuesto[];
  onEliminarProducto: (id: string) => void;
  onProceedToEdit: () => void;
  disabled?: boolean;
}

const ProductSelectionSidebar: React.FC<ProductSelectionSidebarProps> = ({
  productosSeleccionados,
  onEliminarProducto,
  onProceedToEdit,
  disabled = false
}) => {
  const totales = calcularTotalesPresupuesto(productosSeleccionados);

  return (
    <Card className="sticky top-4 h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
          Productos Seleccionados
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Counter Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total de productos:</span>
          <Badge variant="secondary" className="text-sm font-semibold">
            {productosSeleccionados.length}
          </Badge>
        </div>

        {/* Selected Products List */}
        {productosSeleccionados.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {productosSeleccionados.map((producto) => (
              <div 
                key={producto.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {producto.nombre}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      Cant: {producto.cantidad}
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      {formatearPrecio(producto.precioUnitario)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEliminarProducto(producto.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No hay productos seleccionados
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Selecciona productos de la tabla para continuar
            </p>
          </div>
        )}

        {/* Totals Summary */}
        {productosSeleccionados.length > 0 && (
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatearPrecio(totales.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA (19%):</span>
                <span className="font-medium">{formatearPrecio(totales.iva)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold text-base">Total:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatearPrecio(totales.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main CTA Button */}
        <Button 
          onClick={onProceedToEdit}
          disabled={disabled || productosSeleccionados.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-sm"
          size="lg"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Continuar con Edición
          {productosSeleccionados.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-white text-blue-600">
              {productosSeleccionados.length}
            </Badge>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductSelectionSidebar;
