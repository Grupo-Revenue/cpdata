
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { ProductoPresupuesto } from '@/types';

interface ProductExpandedDetailsProps {
  producto: ProductoPresupuesto;
  onActualizarProducto: (id: string, campo: keyof ProductoPresupuesto, valor: any) => void;
}

const ProductExpandedDetails: React.FC<ProductExpandedDetailsProps> = ({
  producto,
  onActualizarProducto
}) => {
  return (
    <TableRow className="bg-gray-50/30">
      <TableCell colSpan={6} className="py-4 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
          {/* Description field */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Descripción del producto
            </label>
            <RichTextEditor
              value={producto.descripcion || ''}
              onChange={(value) => onActualizarProducto(
                producto.id, 
                'descripcion', 
                value
              )}
              placeholder="Describe las características del producto..."
              compact={true}
            />
          </div>
          
          {/* Comments field */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Comentarios adicionales
            </label>
            <RichTextEditor
              value={producto.comentarios || ''}
              onChange={(value) => onActualizarProducto(
                producto.id, 
                'comentarios', 
                value
              )}
              placeholder="Notas internas, observaciones especiales..."
              compact={true}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ProductExpandedDetails;
