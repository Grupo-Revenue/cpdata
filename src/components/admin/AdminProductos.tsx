import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit, Loader2 } from 'lucide-react';
import { formatearPrecio } from '@/utils/formatters';

interface LineaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  categoria?: string;
  activo: boolean;
  created_at: string;
  linea_producto_id?: string;
  linea_producto?: LineaProducto;
}

const AdminProductos: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lineasProducto, setLineasProducto] = useState<LineaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_base: '',
    linea_producto_id: 'none'
  });

  const cargarLineasProducto = async () => {
    try {
      const { data, error } = await supabase
        .from('lineas_producto')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (error) throw error;
      setLineasProducto(data || []);
    } catch (error) {
      console.error('Error cargando líneas de producto:', error);
    }
  };

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos_biblioteca')
        .select(`
          *,
          linea_producto:lineas_producto (
            id,
            nombre,
            descripcion,
            activo
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio_base: '',
      linea_producto_id: 'none'
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precio_base) {
      toast({
        title: "Error",
        description: "Nombre y precio son requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio_base: parseFloat(formData.precio_base),
        linea_producto_id: formData.linea_producto_id === 'none' ? null : formData.linea_producto_id,
        activo: true
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('productos_biblioteca')
          .update(productoData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Producto actualizado",
          description: "El producto se actualizó correctamente"
        });
      } else {
        const { error } = await supabase
          .from('productos_biblioteca')
          .insert([productoData]);

        if (error) throw error;

        toast({
          title: "Producto creado",
          description: "El producto se creó correctamente"
        });
      }

      setDialogOpen(false);
      resetForm();
      cargarProductos();
    } catch (error) {
      console.error('Error guardando producto:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive"
      });
    }
  };

  const toggleActivoProducto = async (id: string, activo: boolean) => {
    try {
      const { error } = await supabase
        .from('productos_biblioteca')
        .update({ activo: !activo })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Producto ${!activo ? 'activado' : 'desactivado'} correctamente`
      });
      
      cargarProductos();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del producto",
        variant: "destructive"
      });
    }
  };

  const editarProducto = (producto: Producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio_base: producto.precio_base.toString(),
      linea_producto_id: producto.linea_producto_id || 'none'
    });
    setDialogOpen(true);
  };

  useEffect(() => {
    cargarLineasProducto();
    cargarProductos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Biblioteca de Productos
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="precio_base">Precio Base (CLP) *</Label>
                    <Input
                      id="precio_base"
                      type="number"
                      step="1"
                      value={formData.precio_base}
                      onChange={(e) => setFormData({...formData, precio_base: e.target.value})}
                      placeholder="Ej: 15000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="linea_producto">Línea de Producto</Label>
                    <Select
                      value={formData.linea_producto_id}
                      onValueChange={(value) => setFormData({...formData, linea_producto_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar línea de producto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin línea específica</SelectItem>
                        {lineasProducto.map((linea) => (
                          <SelectItem key={linea.id} value={linea.id}>
                            {linea.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProduct ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {productos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
              <p className="text-gray-600">Crea tu primer producto para comenzar</p>
            </div>
          ) : (
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
                          onClick={() => editarProducto(producto)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={producto.activo ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleActivoProducto(producto.id, producto.activo)}
                        >
                          {producto.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProductos;
