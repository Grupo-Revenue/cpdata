
import React from 'react';
import { ProductoPresupuesto } from '@/types';
import ProductEditTable from './ProductEditTable';
import QuoteSummaryPanel from './QuoteSummaryPanel';
import EmptyProductsState from './EmptyProductsState';

interface QuoteEditViewProps {
  productos: ProductoPresupuesto[];
  onActualizarProducto: (id: string, campo: keyof ProductoPresupuesto, valor: any) => void;
  onEliminarProducto: (id: string) => void;
  onVolver: () => void;
  onConfirmar: () => void;
  total: number;
}

const QuoteEditView: React.FC<QuoteEditViewProps> = ({
  productos,
  onActualizarProducto,
  onEliminarProducto,
  onVolver,
  onConfirmar,
  total
}) => {
  if (productos.length === 0) {
    return <EmptyProductsState onVolver={onVolver} />;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Lista de productos editables - Tabla compacta */}
      <div className="xl:col-span-3">
        <ProductEditTable
          productos={productos}
          onActualizarProducto={onActualizarProducto}
          onEliminarProducto={onEliminarProducto}
        />
      </div>

      {/* Resumen del presupuesto - Sidebar compacto */}
      <div>
        <QuoteSummaryPanel
          productos={productos}
          onVolver={onVolver}
          onConfirmar={onConfirmar}
        />
      </div>
    </div>
  );
};

export default QuoteEditView;
