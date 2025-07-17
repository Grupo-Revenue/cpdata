
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Package, Trash2, Eye, EyeOff } from 'lucide-react';
import { formatearPrecio, stripHtml } from '@/utils/formatters';
import { Producto } from '../types/producto.types';

interface ProductTableProps {
  productos: Producto[];
  onEditProduct: (producto: Producto) => void;
  onToggleActive: (id: string, activo: boolean) => void;
  onDeleteProduct: (id: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  productos,
  onEditProduct,
  onToggleActive,
  onDeleteProduct
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);

  const handleDeleteClick = (producto: Producto) => {
    setProductToDelete(producto);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete && onDeleteProduct) {
      console.log('Confirmando eliminación del producto:', productToDelete.id);
      onDeleteProduct(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } else {
      console.error('onDeleteProduct no está disponible o productToDelete es null');
    }
  };
  if (productos.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
        <p className="text-gray-600">Crea tu primer producto para comenzar</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Línea de Producto</TableHead>
            <TableHead>Precio Base</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.map((producto) => (
            <TableRow key={producto.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{producto.nombre}</div>
                  {producto.descripcion && (
                    <div className="text-sm text-gray-500">{stripHtml(producto.descripcion, 100)}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {producto.linea_producto ? (
                  <Badge variant="outline">
                    {producto.linea_producto.nombre}
                  </Badge>
                ) : (
                  <span className="text-gray-400">Sin asignar</span>
                )}
              </TableCell>
              <TableCell>
                {formatearPrecio(producto.precio_base)}
              </TableCell>
              <TableCell>
                <Badge variant={producto.activo ? "default" : "secondary"}>
                  {producto.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditProduct(producto)}
                    className="hover:bg-accent hover:text-accent-foreground"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={producto.activo ? "outline" : "default"}
                    size="sm"
                    onClick={() => onToggleActive(producto.id, producto.activo)}
                    className={producto.activo 
                      ? "text-business-parcial-foreground border-business-parcial-foreground hover:bg-business-parcial" 
                      : "bg-business-aceptado text-business-aceptado-foreground hover:bg-business-aceptado/80"
                    }
                  >
                    {producto.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="ml-1">{producto.activo ? 'Desactivar' : 'Activar'}</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(producto)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto "{productToDelete?.nombre}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductTable;
