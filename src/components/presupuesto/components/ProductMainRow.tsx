
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Percent, Trash2, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { ExtendedProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import ProductNumberInput from './ProductNumberInput';
import ProductPriceInput from './ProductPriceInput';

interface ProductMainRowProps {
  producto: ExtendedProductoPresupuesto;
  index: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onActualizarProducto: (id: string, campo: keyof ExtendedProductoPresupuesto, valor: any) => void;
  onEliminarProducto: (id: string) => void;
}

const ProductMainRow: React.FC<ProductMainRowProps> = ({
  producto,
  index,
  isExpanded,
  onToggleExpanded,
  onActualizarProducto,
  onEliminarProducto
}) => {
  const handleDescuentoChange = (value: number) => {
    const descuentoLimitado = Math.max(0, Math.min(100, value));
    console.log('Discount change', { productId: producto.id, value: descuentoLimitado });
    onActualizarProducto(producto.id, 'descuentoPorcentaje', descuentoLimitado);
  };

  const handleToggleExpanded = () => {
    console.log('Toggle expanded', { productId: producto.id, currentState: isExpanded });
    onToggleExpanded();
  };

  return (
    <TableRow className="group hover:bg-gray-50/50">
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex-shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {producto.nombre}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpanded}
              className="h-6 mt-1 px-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Ocultar detalles
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3 mr-1" />
                  Editar detalles
                </>
              )}
            </Button>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <ProductNumberInput
          value={producto.cantidad}
          onChange={(value) => {
            console.log('Quantity change', { productId: producto.id, value });
            onActualizarProducto(producto.id, 'cantidad', value);
          }}
          min={1}
        />
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <ProductPriceInput
          value={producto.precioUnitario || producto.precio_unitario}
          onChange={(value) => {
            console.log('Price change', { productId: producto.id, value });
            onActualizarProducto(producto.id, 'precioUnitario', value);
          }}
          producto={producto}
        />
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <div className="relative inline-block">
          <Percent className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <ProductNumberInput
            value={producto.descuentoPorcentaje || 0}
            onChange={handleDescuentoChange}
            min={0}
            max={100}
            step={0.1}
            className="w-20 h-9 text-center text-sm pr-7 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <div className="text-right">
          {producto.sessions && producto.sessions.length > 0 && (producto as any).baseTotal && (producto as any).sessionsTotal ? (
            <div className="space-y-1">
              <div className="text-xs text-gray-500">
                Base: {formatearPrecio((producto as any).baseTotal)}
              </div>
              <div className="text-xs text-blue-600">
                + Jornadas: {formatearPrecio((producto as any).sessionsTotal)}
              </div>
              <div className="border-t pt-1">
                <span className="font-semibold text-green-600 text-sm">
                  {formatearPrecio(producto.total)}
                </span>
              </div>
            </div>
          ) : (
            <span className="font-semibold text-green-600 text-sm">
              {formatearPrecio(producto.total)}
            </span>
          )}
        </div>
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('Delete product', { productId: producto.id });
            onEliminarProducto(producto.id);
          }}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default ProductMainRow;
