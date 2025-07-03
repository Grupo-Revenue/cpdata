
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { ExtendedProductoPresupuesto, SessionAcreditacion } from '@/types';
import AccreditationSessionsManager from './AccreditationSessionsManager';

interface ProductExpandedDetailsProps {
  producto: ExtendedProductoPresupuesto;
  onActualizarProducto: (id: string, campo: keyof ExtendedProductoPresupuesto, valor: any) => void;
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

  const handleSessionsChange = (sessions: SessionAcreditacion[]) => {
    console.log('Sessions change', { productId: producto.id, sessions });
    onActualizarProducto(producto.id, 'sessions', sessions);
  };

  // Check if this is an accreditation product
  const isAccreditationProduct = producto.nombre.toLowerCase().includes('acreditación') ||
    producto.descripcion?.toLowerCase().includes('acreditación');

  return (
    <TableRow className="bg-gray-50/30">
      <TableCell colSpan={6} className="py-4 px-6">
        <div className="space-y-6">
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

          {/* Accreditation Sessions Manager - Only show for accreditation products */}
          {isAccreditationProduct && (
            <div className="max-w-6xl">
              <AccreditationSessionsManager
                sessions={producto.sessions || []}
                onSessionsChange={handleSessionsChange}
              />
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ProductExpandedDetails;
