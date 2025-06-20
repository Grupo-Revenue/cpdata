
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { DollarSign, Percent, Trash2 } from 'lucide-react';
import { ProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';

interface ProductEditRowProps {
  producto: ProductoPresupuesto;
  index: number;
  onActualizarProducto: (id: string, campo: keyof ProductoPresupuesto, valor: any) => void;
  onEliminarProducto: (id: string) => void;
}

const ProductEditRow: React.FC<ProductEditRowProps> = ({
  producto,
  index,
  onActualizarProducto,
  onEliminarProducto
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

  return (
    <TableRow className="group">
      <TableCell className="p-4 align-top">
        <div className="space-y-2">
          {/* Header del producto más compacto */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex-shrink-0">
              {index + 1}
            </span>
            <h4 className="font-medium text-sm text-gray-900 leading-tight">
              {producto.nombre}
            </h4>
          </div>
          
          {/* Layout horizontal para descripción y comentarios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Descripción
              </label>
              <RichTextEditor
                value={producto.descripcion}
                onChange={(value) => onActualizarProducto(
                  producto.id, 
                  'descripcion', 
                  value
                )}
                placeholder="Descripción del producto..."
                className="text-xs compact-editor"
                showLists={true}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Comentarios
              </label>
              <RichTextEditor
                value={producto.comentarios || ''}
                onChange={(value) => onActualizarProducto(
                  producto.id, 
                  'comentarios', 
                  value
                )}
                placeholder="Comentarios adicionales..."
                className="text-xs compact-editor"
                showLists={true}
              />
            </div>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="p-4 text-center align-middle">
        <Input
          type="number"
          min="1"
          value={producto.cantidad}
          onChange={(e) => onActualizarProducto(
            producto.id, 
            'cantidad', 
            parseInt(e.target.value) || 1
          )}
          className="w-16 h-9 text-center text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
        />
      </TableCell>
      
      <TableCell className="p-4 text-center align-middle">
        <div className="relative inline-block">
          <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            type="text"
            value={producto.precioUnitario === 0 ? '' : formatearNumeroConSeparadores(producto.precioUnitario)}
            onChange={(e) => handlePrecioChange(producto.id, e.target.value)}
            onKeyDown={handlePrecioKeyPress}
            className="w-28 h-9 text-center text-sm pl-7 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="0"
            style={{ MozAppearance: 'textfield' }}
          />
        </div>
      </TableCell>
      
      <TableCell className="p-4 text-center align-middle">
        <div className="relative inline-block">
          <Percent className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={producto.descuentoPorcentaje}
            onChange={(e) => handleDescuentoChange(producto.id, e.target.value)}
            className="w-20 h-9 text-center text-sm pr-7 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="0"
            style={{ MozAppearance: 'textfield' }}
          />
        </div>
      </TableCell>
      
      <TableCell className="p-4 text-center align-middle">
        <span className="font-semibold text-green-600 text-sm">
          {formatearPrecio(producto.total)}
        </span>
      </TableCell>
      
      <TableCell className="p-4 text-center align-middle">
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

export default ProductEditRow;
