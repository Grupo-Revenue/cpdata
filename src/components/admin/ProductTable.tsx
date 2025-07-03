
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2, Plus, RefreshCw, UserPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  categoria: string;
  activo: boolean;
  created_at: string;
  linea_producto?: {
    nombre: string;
  };
}

interface ProductTableProps {
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  handleCreateUser: () => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  email,
  password,
  setEmail,
  setPassword,
  handleCreateUser
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_base: 0,
    categoria: '',
    activo: true
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const { data: products, error } = await supabase
        .from('productos_biblioteca')
        .select(`
          id,
          nombre,
          descripcion,
          precio_base,
          categoria,
          activo,
          created_at,
          lineas_producto(nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive"
        });
        return;
      }

      setProducts(products || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al cargar productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('productos_biblioteca')
          .update(formData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente",
        });
      } else {
        // Create new product
        const { error } = await supabase
          .from('productos_biblioteca')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Producto creado correctamente",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar producto",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio_base: product.precio_base,
      categoria: product.categoria,
      activo: product.activo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('productos_biblioteca')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar producto",
        variant: "destructive"
      });
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('productos_biblioteca')
        .update({ activo: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Producto ${!currentStatus ? 'activado' : 'desactivado'}`,
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cambiar estado del producto",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio_base: 0,
      categoria: '',
      activo: true
    });
    setEditingProduct(null);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando productos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Productos</h2>
        <div className="flex gap-2">
          <Button onClick={fetchProducts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Crear un nuevo usuario</AlertDialogTitle>
                <AlertDialogDescription>
                  Ingrese el correo electrónico y la contraseña del nuevo usuario.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" type="email" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" type="password" />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateUser}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct ? 'Actualiza los datos del producto' : 'Ingresa los datos del nuevo producto'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nombre" className="text-right">
                      Nombre
                    </Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="descripcion" className="text-right">
                      Descripción
                    </Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="precio_base" className="text-right">
                      Precio Base
                    </Label>
                    <Input
                      id="precio_base"
                      type="number"
                      value={formData.precio_base}
                      onChange={(e) => setFormData({ ...formData, precio_base: parseFloat(e.target.value) || 0 })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoria" className="text-right">
                      Categoría
                    </Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProduct ? 'Actualizar' : 'Crear'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Precio Base</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.nombre}</TableCell>
                <TableCell>{product.descripcion || '-'}</TableCell>
                <TableCell>${product.precio_base.toLocaleString()}</TableCell>
                <TableCell>{product.categoria}</TableCell>
                <TableCell>
                  <Badge variant={product.activo ? 'default' : 'secondary'}>
                    {product.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleProductStatus(product.id, product.activo)}
                    >
                      {product.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron productos
        </div>
      )}
    </div>
  );
};
