
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import { ExtendedProductoPresupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularTotalesPresupuesto } from '@/utils/quoteCalculations';

interface QuoteSummaryPanelProps {
  productos: ExtendedProductoPresupuesto[];
  onVolver: () => void;
  onConfirmar: () => void;
  isSaving?: boolean;
}

const QuoteSummaryPanel: React.FC<QuoteSummaryPanelProps> = ({
  productos,
  onVolver,
  onConfirmar,
  isSaving = false
}) => {
  const totales = calcularTotalesPresupuesto(productos);

  return (
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
            disabled={productos.length === 0 || isSaving}
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Presupuesto'
            )}
          </Button>
          
          <Button 
            onClick={onVolver}
            variant="outline" 
            className="w-full"
            disabled={isSaving}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Agregar más productos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteSummaryPanel;
