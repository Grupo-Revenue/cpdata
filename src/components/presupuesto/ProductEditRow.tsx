
import React, { useState } from 'react';
import { ExtendedProductoPresupuesto } from '@/types';
import ProductMainRow from './components/ProductMainRow';
import ProductExpandedDetails from './components/ProductExpandedDetails';

interface ProductEditRowProps {
  producto: ExtendedProductoPresupuesto;
  index: number;
  onActualizarProducto: (id: string, campo: keyof ExtendedProductoPresupuesto, valor: any) => void;
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
          originalLibraryDescription={producto.originalLibraryDescription}
        />
      )}
    </>
  );
};

export default ProductEditRow;
