
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
  const handleDescripcionChange = (value: string) => {
    console.log('Description change', { productId: producto.id, value });
    onActualizarProducto(producto.id, 'descripcion', value);
  };

  const handleComentariosChange = (value: string) => {
    console.log('Comments change', { productId: producto.id, value });
    onActualizarProducto(producto.id, 'comentarios', value);
  };

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
              onChange={handleDescripcionChange}
              placeholder="Describe las características del producto..."
              className="min-h-[100px]"
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
              onChange={handleComentariosChange}
              placeholder="Notas internas, observaciones especiales..."
              className="min-h-[100px]"
              compact={true}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ProductExpandedDetails;
