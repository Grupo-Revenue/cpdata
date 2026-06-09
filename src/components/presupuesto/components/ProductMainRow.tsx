
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Percent, Trash2, ChevronDown, ChevronUp, Edit3, Tag, X } from 'lucide-react';
import { ExtendedProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularDescuentoEquivalente } from '@/utils/quoteCalculations';
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

  const sessionsTotal = (producto.sessions || []).reduce(
    (sum: number, s: any) => sum + (Number(s.monto) || 0),
    0
  );
  const hasSessions = !!(producto.sessions && producto.sessions.length > 0 && sessionsTotal > 0);

  const manualRaw = producto.precioFinalManual ?? producto.precio_final_manual;
  const hasManual = manualRaw !== null && manualRaw !== undefined;
  const manualValue = hasManual ? Number(manualRaw) : 0;

  const cantidad = Number(producto.cantidad) || 1;
  const precioUnit = Number(producto.precioUnitario || producto.precio_unitario) || 0;
  const listaSubtotal = hasSessions ? sessionsTotal : cantidad * precioUnit;

  const calculatedTotal = hasSessions ? sessionsTotal : Number(producto.total) || 0;
  const displayTotal = hasManual ? manualValue : calculatedTotal;

  const exceedsLista = hasManual && manualValue > listaSubtotal && listaSubtotal > 0;
  const equivalente = hasManual
    ? calcularDescuentoEquivalente(precioUnit, cantidad, manualValue)
    : { porcentaje: 0, monto: 0 };

  const handleManualChange = (raw: string) => {
    if (raw === '') {
      onActualizarProducto(producto.id, 'precioFinalManual' as any, null);
      return;
    }
    const num = parseFloat(raw);
    if (!Number.isFinite(num) || num < 0) return;
    onActualizarProducto(producto.id, 'precioFinalManual' as any, num);
  };

  const handleFixPrice = () => {
    // Start manual price at the current calculated total
    onActualizarProducto(producto.id, 'precioFinalManual' as any, calculatedTotal || listaSubtotal || 0);
  };

  const handleClearManual = () => {
    onActualizarProducto(producto.id, 'precioFinalManual' as any, null);
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
            disabled={hasManual}
            className={`w-20 h-9 text-center text-sm pr-7 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${hasManual ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
        {hasManual && (
          <div className="text-[10px] text-gray-400 mt-1" title="El precio manual tiene prioridad sobre el descuento %.">
            Precio manual activo
          </div>
        )}
      </TableCell>
      
      <TableCell className="text-center align-middle py-3">
        <div className="text-right space-y-1">
          {hasSessions && (
            <div className="text-xs text-blue-600">
              Jornadas: {formatearPrecio(sessionsTotal)}
            </div>
          )}
          {!hasManual ? (
            <>
              <span className="font-semibold text-green-600 text-sm block">
                {formatearPrecio(displayTotal)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFixPrice}
                className="h-6 px-2 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Fijar un precio final manual para esta línea"
              >
                <Tag className="w-3 h-3 mr-1" />
                Fijar precio
              </Button>
            </>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-end gap-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  MANUAL
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearManual}
                  className="h-5 w-5 p-0 text-gray-400 hover:text-red-600"
                  title="Quitar precio manual y volver al cálculo estándar"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <input
                type="number"
                min={0}
                step={1}
                value={manualValue}
                onChange={(e) => handleManualChange(e.target.value)}
                className={`w-28 h-9 text-right text-sm px-2 rounded-md border ${exceedsLista ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/20'} bg-amber-50/40 font-semibold text-green-700 focus:outline-none focus:ring-2`}
              />
              {listaSubtotal > 0 && (
                <div className={`text-[10px] ${exceedsLista ? 'text-red-600' : 'text-gray-500'}`}>
                  {exceedsLista ? (
                    <>No puede superar el precio de lista ({formatearPrecio(listaSubtotal)})</>
                  ) : (
                    <>
                      Desc. equiv.: {equivalente.porcentaje.toFixed(2)}% (−{formatearPrecio(equivalente.monto)})
                    </>
                  )}
                </div>
              )}
            </div>
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
