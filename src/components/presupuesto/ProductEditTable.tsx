
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductoPresupuesto } from '@/types';
import ProductEditRow from './ProductEditRow';

interface ProductEditTableProps {
  productos: ProductoPresupuesto[];
  onActualizarProducto: (id: string, campo: keyof ProductoPresupuesto, valor: any) => void;
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
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[280px]">Producto</TableHead>
                <TableHead className="w-[70px] text-center">Cant.</TableHead>
                <TableHead className="w-[110px] text-center">Precio Unit.</TableHead>
                <TableHead className="w-[90px] text-center">Desc. %</TableHead>
                <TableHead className="w-[110px] text-center">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
