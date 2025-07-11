
import React from 'react';
import { ExtendedProductoPresupuesto } from '@/types';
import ProductEditTable from './ProductEditTable';
import QuoteSummaryPanel from './QuoteSummaryPanel';
import EmptyProductsState from './EmptyProductsState';

interface QuoteEditViewProps {
  productos: ExtendedProductoPresupuesto[];
  onActualizarProducto: (id: string, campo: keyof ExtendedProductoPresupuesto, valor: any) => void;
  onEliminarProducto: (id: string) => void;
  onVolver: () => void;
  onConfirmar: () => void;
  total: number;
  isSaving?: boolean;
}

const QuoteEditView: React.FC<QuoteEditViewProps> = ({
  productos,
  onActualizarProducto,
  onEliminarProducto,
  onVolver,
  onConfirmar,
  total,
  isSaving = false
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
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};

export default QuoteEditView;
