
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Percent, Trash2, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { ProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import ProductNumberInput from './ProductNumberInput';
import ProductPriceInput from './ProductPriceInput';

interface ProductMainRowProps {
  producto: ProductoPresupuesto;
  index: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onActualizarProducto: (id: string, campo: keyof ProductoPresupuesto, valor: any) => void;
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
    onActualizarProducto(producto.id, 'descuentoPorcentaje', descuentoLimitado);
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
              onClick={onToggleExpanded}
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
          onChange={(value) => onActualizarProducto(producto.id, 'cantidad', value)}
          min={1}
        />
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <ProductPriceInput
          value={producto.precioUnitario}
          onChange={(value) => onActualizarProducto(producto.id, 'precioUnitario', value)}
        />
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <div className="relative inline-block">
          <Percent className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <ProductNumberInput
            value={producto.descuentoPorcentaje}
            onChange={handleDescuentoChange}
            min={0}
            max={100}
            step={0.1}
            className="w-20 h-9 text-center text-sm pr-7 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <span className="font-semibold text-green-600 text-sm">
          {formatearPrecio(producto.total)}
        </span>
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEliminarProducto(producto.id)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default ProductMainRow;
