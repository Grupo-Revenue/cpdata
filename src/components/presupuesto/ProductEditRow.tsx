
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Percent, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  const formatearNumeroConSeparadores = (numero: number): string => {
    return new Intl.NumberFormat('es-CL').format(numero);
  };

  const parsearNumeroConSeparadores = (valor: string): number => {
    const numeroLimpio = valor.replace(/\./g, '');
    return parseInt(numeroLimpio) || 0;
  };

  const handlePrecioChange = (id: string, value: string) => {
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
    if (!/[\d.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleDescuentoChange = (id: string, value: string) => {
    const numeroValue = parseFloat(value) || 0;
    const descuentoLimitado = Math.max(0, Math.min(100, numeroValue));
    onActualizarProducto(id, 'descuentoPorcentaje', descuentoLimitado);
  };

  const hasDetails = producto.descripcion || producto.comentarios;

  return (
    <>
      {/* Main product row */}
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
              {hasDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 mt-1 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Ocultar detalles
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Ver detalles
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </TableCell>
        
        <TableCell className="text-center align-middle py-3">
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
        
        <TableCell className="text-center align-middle py-3">
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
        
        <TableCell className="text-center align-middle py-3">
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

      {/* Expandable details row */}
      {isExpanded && hasDetails && (
        <TableRow className="bg-gray-50/30">
          <TableCell colSpan={6} className="py-4 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              {producto.descripcion && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">
                    Descripción
                  </label>
                  <Textarea
                    value={producto.descripcion.replace(/<[^>]*>/g, '')} // Strip HTML tags for textarea
                    onChange={(e) => onActualizarProducto(
                      producto.id, 
                      'descripcion', 
                      e.target.value
                    )}
                    placeholder="Descripción del producto..."
                    className="min-h-[80px] text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                    rows={3}
                  />
                </div>
              )}
              {producto.comentarios && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">
                    Comentarios
                  </label>
                  <Textarea
                    value={producto.comentarios.replace(/<[^>]*>/g, '')} // Strip HTML tags for textarea
                    onChange={(e) => onActualizarProducto(
                      producto.id, 
                      'comentarios', 
                      e.target.value
                    )}
                    placeholder="Comentarios adicionales..."
                    className="min-h-[80px] text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default ProductEditRow;
