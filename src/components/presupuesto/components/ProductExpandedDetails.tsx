
import React, { useState, useEffect } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw } from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { ExtendedProductoPresupuesto, SessionAcreditacion } from '@/types';
import AccreditationSessionsManager from './AccreditationSessionsManager';

interface ProductExpandedDetailsProps {
  producto: ExtendedProductoPresupuesto;
  onActualizarProducto: (id: string, campo: keyof ExtendedProductoPresupuesto, valor: any) => void;
  originalLibraryDescription?: string; // Optional: original description from library
}

const ProductExpandedDetails: React.FC<ProductExpandedDetailsProps> = ({
  producto,
  onActualizarProducto,
  originalLibraryDescription
}) => {
  const [showLibraryReference, setShowLibraryReference] = useState(false);
  const [descriptionSource, setDescriptionSource] = useState<'library' | 'custom'>('library');

  // Initialize description handling
  useEffect(() => {
    const currentDesc = producto.descripcion || '';
    // Check if description appears to be from library (plain text) or custom (HTML)
    const hasHtmlTags = /<[^>]*>/g.test(currentDesc);
    setDescriptionSource(hasHtmlTags ? 'custom' : 'library');
  }, [producto.descripcion]);

  const handleDescripcionChange = (value: string) => {
    console.log('Description change', { productId: producto.id, value });
    setDescriptionSource('custom');
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

  const handleCopyLibraryDescription = () => {
    if (originalLibraryDescription) {
      onActualizarProducto(producto.id, 'descripcion', originalLibraryDescription);
      setDescriptionSource('library');
    }
  };

  const handleResetToLibrary = () => {
    if (originalLibraryDescription) {
      onActualizarProducto(producto.id, 'descripcion', originalLibraryDescription);
      setDescriptionSource('library');
    }
  };

  // Determine what to show as library description reference
  const libraryDescToShow = originalLibraryDescription || 
    (descriptionSource === 'library' ? producto.descripcion : '');

  // Check if this is an accreditation product
  const isAccreditationProduct = producto.nombre.toLowerCase().includes('acreditación') ||
    producto.descripcion?.toLowerCase().includes('acreditación');

  return (
    <TableRow className="bg-gray-50/30">
      <TableCell colSpan={6} className="py-4 px-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
            {/* Description field with library reference */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">
                  Descripción del producto
                </label>
                <div className="flex items-center gap-2">
                  <Badge variant={descriptionSource === 'library' ? 'default' : 'secondary'} className="text-xs">
                    {descriptionSource === 'library' ? 'Original' : 'Personalizada'}
                  </Badge>
                  {libraryDescToShow && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLibraryReference(!showLibraryReference)}
                      className="h-6 px-2 text-xs"
                    >
                      {showLibraryReference ? 'Ocultar referencia' : 'Ver original'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Library reference card */}
              {showLibraryReference && libraryDescToShow && (
                <Card className="bg-blue-50/50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-blue-800 flex items-center justify-between">
                      Descripción original de la biblioteca
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyLibraryDescription}
                          className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800"
                          title="Copiar descripción original"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResetToLibrary}
                          className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800"
                          title="Restaurar descripción original"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-blue-700 leading-relaxed">{libraryDescToShow}</p>
                  </CardContent>
                </Card>
              )}

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
