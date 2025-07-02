
import React from 'react';
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
import { Edit, Package } from 'lucide-react';
import { formatearPrecio } from '@/utils/formatters';
import { Producto } from '../types/producto.types';

interface ProductTableProps {
  productos: Producto[];
  onEditProduct: (producto: Producto) => void;
  onToggleActive: (id: string, activo: boolean) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  productos,
  onEditProduct,
  onToggleActive
}) => {
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
                  <div className="text-sm text-gray-500">{producto.descripcion}</div>
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
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditProduct(producto)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant={producto.activo ? "destructive" : "default"}
                  size="sm"
                  onClick={() => onToggleActive(producto.id, producto.activo)}
                >
                  {producto.activo ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductTable;
