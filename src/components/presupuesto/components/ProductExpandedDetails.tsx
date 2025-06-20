
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ProductoPresupuesto } from '@/types';

interface ProductExpandedDetailsProps {
  producto: ProductoPresupuesto;
  onActualizarProducto: (id: string, campo: keyof ProductoPresupuesto, valor: any) => void;
}

const ProductExpandedDetails: React.FC<ProductExpandedDetailsProps> = ({
  producto,
  onActualizarProducto
}) => {
  const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('Description change', { productId: producto.id, value: e.target.value });
    onActualizarProducto(producto.id, 'descripcion', e.target.value);
  };

  const handleComentariosChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('Comments change', { productId: producto.id, value: e.target.value });
    onActualizarProducto(producto.id, 'comentarios', e.target.value);
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
            <Textarea
              value={producto.descripcion || ''}
              onChange={handleDescripcionChange}
              placeholder="Describe las características del producto..."
              className="min-h-[100px] resize-none"
              rows={4}
            />
          </div>
          
          {/* Comments field */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Comentarios adicionales
            </label>
            <Textarea
              value={producto.comentarios || ''}
              onChange={handleComentariosChange}
              placeholder="Notas internas, observaciones especiales..."
              className="min-h-[100px] resize-none"
              rows={4}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ProductExpandedDetails;
