
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Check, Receipt } from 'lucide-react';
import { ProductoPresupuesto } from '@/types';
import { calcularSubtotal, calcularIVA } from '@/utils/vatCalculations';
import AnimatedPrice from '@/components/ui/animated-price';

interface EnhancedQuoteSummaryProps {
  productos: ProductoPresupuesto[];
  total: number;
  previousTotal?: number;
  onConfirmar: () => void;
  className?: string;
}

const EnhancedQuoteSummary: React.FC<EnhancedQuoteSummaryProps> = ({
  productos,
  total,
  previousTotal,
  onConfirmar,
  className
}) => {
  const subtotal = calcularSubtotal(total);
  const iva = calcularIVA(subtotal);
  const cantidadTotal = productos.reduce((sum, p) => sum + p.cantidad, 0);

  return (
    <Card className={cn("sticky top-4", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base">
          <Receipt className="w-4 h-4 mr-2" />
          Resumen del Presupuesto
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Estadísticas básicas */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Productos:</span>
            <Badge variant="outline" className="text-xs">
              {productos.length}
            </Badge>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cantidad total:</span>
            <span className="font-medium">{cantidadTotal}</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Desglose financiero */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <AnimatedPrice 
              value={subtotal} 
              previousValue={previousTotal ? calcularSubtotal(previousTotal) : undefined}
              size="sm" 
              showIcon={false}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IVA (19%):</span>
            <AnimatedPrice 
              value={iva} 
              previousValue={previousTotal ? calcularIVA(calcularSubtotal(previousTotal)) : undefined}
              size="sm" 
              showIcon={false}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Total */}
        <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
          <span className="font-semibold text-gray-900">Total:</span>
          <AnimatedPrice 
            value={total} 
            previousValue={previousTotal}
            size="lg"
            className="text-green-700"
          />
        </div>
        
        {/* Botón de confirmación */}
        <Button 
          onClick={onConfirmar} 
          className="w-full bg-green-600 hover:bg-green-700 mt-4 transition-all duration-200 hover:scale-[1.02]"
          disabled={productos.length === 0}
        >
          <Check className="w-4 h-4 mr-2" />
          Confirmar Presupuesto
          <span className="block text-xs opacity-80 ml-2">
            ({productos.length} productos)
          </span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default EnhancedQuoteSummary;
