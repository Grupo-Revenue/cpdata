
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Plus } from 'lucide-react';
import { ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';
import { formatearPrecio, stripHtml } from '@/utils/formatters';
import { ProductoPresupuesto } from '@/types';

interface ProductsSelectionTableProps {
  productos: ProductoBiblioteca[];
  productosSeleccionados: ProductoPresupuesto[];
  onProductoSeleccionado: (producto: ProductoBiblioteca) => void;
  onProductoDeseleccionado: (productoId: string) => void;
  loading?: boolean;
}

const ProductsSelectionTable: React.FC<ProductsSelectionTableProps> = ({
  productos,
  productosSeleccionados,
  onProductoSeleccionado,
  onProductoDeseleccionado,
  loading = false
}) => {
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const categorias = useMemo(() => {
    const cats = new Set(productos.map(p => p.linea_producto?.nombre || p.categoria));
    return Array.from(cats).sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter(producto => {
      const matchTexto = !filtroTexto || 
        producto.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(filtroTexto.toLowerCase()));
      
      const matchCategoria = !filtroCategoria || 
        (producto.linea_producto?.nombre || producto.categoria) === filtroCategoria;
      
      return matchTexto && matchCategoria;
    });
  }, [productos, filtroTexto, filtroCategoria]);

  const isProductoSeleccionado = (productoId: string) => {
    return productosSeleccionados.some(p => p.id.includes(productoId));
  };

  const handleToggleProducto = (producto: ProductoBiblioteca, checked: boolean) => {
    if (checked) {
      onProductoSeleccionado(producto);
    } else {
      const productoSeleccionado = productosSeleccionados.find(p => p.id.includes(producto.id));
      if (productoSeleccionado) {
        onProductoDeseleccionado(productoSeleccionado.id);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
        </CardContent>
      </Card>
    );
  }

  if (productos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos disponibles</h3>
          <p className="text-gray-600">Los productos deben ser creados desde la sección de administración</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Seleccionar Productos ({productosSeleccionados.length} seleccionados)
        </CardTitle>
        
        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar productos..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Sel.</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio Base</TableHead>
                <TableHead className="w-24">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productosFiltrados.map((producto) => {
                const seleccionado = isProductoSeleccionado(producto.id);
                return (
                  <TableRow key={producto.id} className={seleccionado ? 'bg-blue-50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={seleccionado}
                        onCheckedChange={(checked) => handleToggleProducto(producto, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{producto.nombre}</div>
                        {producto.descripcion && (
                          <div className="text-sm text-gray-600">{stripHtml(producto.descripcion, 100)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {producto.linea_producto?.nombre || producto.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatearPrecio(producto.precio_base)}
                    </TableCell>
                    <TableCell>
                      {!seleccionado ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onProductoSeleccionado(producto)}
                          className="h-8"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Agregado</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {productosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron productos que coincidan con los filtros
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsSelectionTable;
