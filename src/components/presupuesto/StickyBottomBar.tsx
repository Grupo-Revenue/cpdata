
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { ProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularTotalesPresupuesto } from '@/utils/quoteCalculations';

interface StickyBottomBarProps {
  productosSeleccionados: ProductoPresupuesto[];
  onProceedToEdit: () => void;
  disabled?: boolean;
}

const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  productosSeleccionados,
  onProceedToEdit,
  disabled = false
}) => {
  const totales = calcularTotalesPresupuesto(productosSeleccionados);

  if (productosSeleccionados.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-100 shadow-2xl z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Summary */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {productosSeleccionados.length} productos
              </Badge>
            </div>
            <div className="hidden sm:flex items-center space-x-4 text-sm">
              <span className="text-gray-600">
                Subtotal: <span className="font-medium">{formatearPrecio(totales.subtotal)}</span>
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                Total: <span className="font-bold text-green-600">{formatearPrecio(totales.total)}</span>
              </span>
            </div>
            <div className="sm:hidden">
              <span className="text-lg font-bold text-green-600">
                {formatearPrecio(totales.total)}
              </span>
            </div>
          </div>

          {/* Right side - CTA */}
          <Button 
            onClick={onProceedToEdit}
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3"
            size="lg"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Continuar con Edición
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyBottomBar;
