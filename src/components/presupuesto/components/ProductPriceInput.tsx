
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { ExtendedProductoPresupuesto } from '@/types';
import { useProductLineCheck } from '@/hooks/useProductLineCheck';
import { useProductosBiblioteca } from '@/hooks/useProductosBiblioteca';
import PriceCalculatorDialog from '../PriceCalculatorDialog';
import ProductNumberInput from './ProductNumberInput';

interface ProductPriceInputProps {
  value: number;
  onChange: (value: number) => void;
  producto?: ExtendedProductoPresupuesto;
  className?: string;
}

const ProductPriceInput: React.FC<ProductPriceInputProps> = ({
  value,
  onChange,
  producto,
  className = ""
}) => {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const { isAcreditacionProduct } = useProductLineCheck();
  const { productos: productosBiblioteca } = useProductosBiblioteca();

  // Check if this product belongs to Acreditación line
  const shouldShowCalculator = React.useMemo(() => {
    if (!producto) return false;

    // First check if the product has a direct linea_producto_id
    if (producto.linea_producto_id) {
      return isAcreditacionProduct(producto.linea_producto_id);
    }

    // If not, try to find it in the biblioteca by matching the name
    const bibliotecaProduct = productosBiblioteca.find(p => 
      p.nombre === producto.nombre || 
      producto.id.includes(p.id)
    );

    if (bibliotecaProduct?.linea_producto_id) {
      return isAcreditacionProduct(bibliotecaProduct.linea_producto_id);
    }

    return false;
  }, [producto, isAcreditacionProduct, productosBiblioteca]);

  const handlePriceCalculated = (calculatedPrice: number) => {
    onChange(calculatedPrice);
  };

  return (
    <div className="flex items-center gap-2">
      <ProductNumberInput
        value={value}
        onChange={onChange}
        min={0}
        step={1}
        className={className}
      />
      
      {shouldShowCalculator && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCalculatorOpen(true)}
          className="h-9 px-2 flex-shrink-0"
          title="Calcular precio"
        >
          <Calculator className="w-4 h-4" />
        </Button>
      )}

      {shouldShowCalculator && (
        <PriceCalculatorDialog
          open={calculatorOpen}
          onOpenChange={setCalculatorOpen}
          onPriceCalculated={handlePriceCalculated}
          initialAttendees={0}
        />
      )}
    </div>
  );
};

export default ProductPriceInput;
