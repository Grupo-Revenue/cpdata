import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Package, Tag, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  precio_base: number;
  activo: boolean;
  linea_producto_id: string | null;
  created_at: string;
}

const ProductLibrary = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos_biblioteca')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error fetching productos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca de Productos</h2>
          <p className="text-muted-foreground">
            Productos disponibles para presupuestos
          </p>
        </div>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {productos.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No hay productos</h3>
                <p className="text-muted-foreground">
                  Comienza agregando productos a tu biblioteca
                </p>
              </div>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Crear Producto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <Card key={producto.id} className="hover-lift">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{producto.nombre}</CardTitle>
                    {producto.descripcion && (
                      <CardDescription className="mt-1">
                        {producto.descripcion}
                      </CardDescription>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{producto.categoria}</Badge>
                    </div>
                    <div className="text-lg font-semibold text-primary">
                      {formatCurrency(producto.precio_base)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <Badge variant={producto.activo ? 'default' : 'secondary'}>
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductLibrary;