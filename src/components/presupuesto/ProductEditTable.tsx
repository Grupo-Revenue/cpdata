
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExtendedProductoPresupuesto } from '@/types';
import ProductEditRow from './ProductEditRow';

interface ProductEditTableProps {
  productos: ExtendedProductoPresupuesto[];
  onActualizarProducto: (id: string, campo: keyof ExtendedProductoPresupuesto, valor: any) => void;
  onEliminarProducto: (id: string) => void;
}

const ProductEditTable: React.FC<ProductEditTableProps> = ({
  productos,
  onActualizarProducto,
  onEliminarProducto
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Productos del Presupuesto</CardTitle>
        <p className="text-sm text-gray-600">
          Haz clic en "Ver detalles" para editar descripciones y comentarios
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[300px] font-semibold text-gray-700">Producto</TableHead>
                <TableHead className="w-[80px] text-center font-semibold text-gray-700">Cant.</TableHead>
                <TableHead className="w-[120px] text-center font-semibold text-gray-700">Precio Unit.</TableHead>
                <TableHead className="w-[100px] text-center font-semibold text-gray-700">Desc. %</TableHead>
                <TableHead className="w-[120px] text-center font-semibold text-gray-700">Total</TableHead>
                <TableHead className="w-[60px] text-center font-semibold text-gray-700"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((producto, index) => (
                <ProductEditRow
                  key={producto.id}
                  producto={producto}
                  index={index}
                  onActualizarProducto={onActualizarProducto}
                  onEliminarProducto={onEliminarProducto}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductEditTable;
