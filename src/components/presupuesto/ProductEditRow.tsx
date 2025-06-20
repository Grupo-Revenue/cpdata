
import React, { useState } from 'react';
import { ProductoPresupuesto } from '@/types';
import ProductMainRow from './components/ProductMainRow';
import ProductExpandedDetails from './components/ProductExpandedDetails';

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

  return (
    <>
      <ProductMainRow
        producto={producto}
        index={index}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded(!isExpanded)}
        onActualizarProducto={onActualizarProducto}
        onEliminarProducto={onEliminarProducto}
      />
      
      {isExpanded && (
        <ProductExpandedDetails
          producto={producto}
          onActualizarProducto={onActualizarProducto}
        />
      )}
    </>
  );
};

export default ProductEditRow;
