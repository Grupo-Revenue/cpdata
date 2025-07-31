
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit, ArrowUp, ArrowDown, Loader2, Trash2 } from 'lucide-react';

interface LineaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  created_at: string;
}

const AdminLineasProducto: React.FC = () => {
  const [lineas, setLineas] = useState<LineaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLinea, setEditingLinea] = useState<LineaProducto | null>(null);
  const [deletingLinea, setDeletingLinea] = useState<LineaProducto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const cargarLineas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lineas_producto')
        .select('*')
        .order('orden', { ascending: true });

      if (error) throw error;
      setLineas(data || []);
    } catch (error) {
      console.error('Error cargando líneas de producto:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las líneas de producto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: ''
    });
    setEditingLinea(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive"
      });
      return;
    }

    try {
      const lineaData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        activo: true
      };

      if (editingLinea) {
        const { error } = await supabase
          .from('lineas_producto')
          .update(lineaData)
          .eq('id', editingLinea.id);

        if (error) throw error;

        toast({
          title: "Línea actualizada",
          description: "La línea de producto se actualizó correctamente"
        });
      } else {
        // Obtener el próximo orden
        const { data: maxOrden } = await supabase
          .from('lineas_producto')
          .select('orden')
          .order('orden', { ascending: false })
          .limit(1);

        const nuevoOrden = maxOrden && maxOrden.length > 0 ? maxOrden[0].orden + 1 : 1;

        const { error } = await supabase
          .from('lineas_producto')
          .insert([{ ...lineaData, orden: nuevoOrden }]);

        if (error) throw error;

        toast({
          title: "Línea creada",
          description: "La línea de producto se creó correctamente"
        });
      }

      setDialogOpen(false);
      resetForm();
      cargarLineas();
    } catch (error) {
      console.error('Error guardando línea:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la línea de producto",
        variant: "destructive"
      });
    }
  };

  const toggleActivoLinea = async (id: string, activo: boolean) => {
    try {
      const { error } = await supabase
        .from('lineas_producto')
        .update({ activo: !activo })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Línea ${!activo ? 'activada' : 'desactivada'} correctamente`
      });
      
      cargarLineas();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la línea",
        variant: "destructive"
      });
    }
  };

  const cambiarOrden = async (id: string, direccion: 'up' | 'down') => {
    try {
      const lineaActual = lineas.find(l => l.id === id);
      if (!lineaActual) return;

      const nuevasLineas = [...lineas];
      const indiceActual = nuevasLineas.findIndex(l => l.id === id);
      
      let indiceDestino;
      if (direccion === 'up' && indiceActual > 0) {
        indiceDestino = indiceActual - 1;
      } else if (direccion === 'down' && indiceActual < nuevasLineas.length - 1) {
        indiceDestino = indiceActual + 1;
      } else {
        return;
      }

      // Intercambiar órdenes manualmente
      const ordenActual = nuevasLineas[indiceActual].orden;
      const ordenDestino = nuevasLineas[indiceDestino].orden;

      // Actualizar ambas líneas
      await supabase
        .from('lineas_producto')
        .update({ orden: ordenDestino })
        .eq('id', nuevasLineas[indiceActual].id);

      await supabase
        .from('lineas_producto')
        .update({ orden: ordenActual })
        .eq('id', nuevasLineas[indiceDestino].id);

      cargarLineas();
    } catch (error) {
      console.error('Error cambiando orden:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el orden",
        variant: "destructive"
      });
    }
  };

  const editarLinea = (linea: LineaProducto) => {
    setEditingLinea(linea);
    setFormData({
      nombre: linea.nombre,
      descripcion: linea.descripcion || ''
    });
    setDialogOpen(true);
  };

  const confirmarEliminarLinea = async (linea: LineaProducto) => {
    try {
      // Verificar si la línea tiene productos asociados
      const { data: productosAsociados, error: errorProductos } = await supabase
        .from('productos_biblioteca')
        .select('id')
        .eq('linea_producto_id', linea.id)
        .limit(1);

      if (errorProductos) throw errorProductos;

      if (productosAsociados && productosAsociados.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: `La línea "${linea.nombre}" tiene productos asociados. Desactívala en lugar de eliminarla.`,
          variant: "destructive"
        });
        return;
      }

      // Si no hay productos asociados, mostrar diálogo de confirmación
      setDeletingLinea(linea);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error verificando productos asociados:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar si la línea tiene productos asociados",
        variant: "destructive"
      });
    }
  };

  const eliminarLinea = async () => {
    if (!deletingLinea) return;

    try {
      const { error } = await supabase
        .from('lineas_producto')
        .delete()
        .eq('id', deletingLinea.id);

      if (error) throw error;

      toast({
        title: "Línea eliminada",
        description: `La línea "${deletingLinea.nombre}" se eliminó correctamente`
      });

      setDeleteDialogOpen(false);
      setDeletingLinea(null);
      cargarLineas();
    } catch (error) {
      console.error('Error eliminando línea:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la línea de producto",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    cargarLineas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando líneas de producto...</p>
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
              Líneas de Producto
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Línea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingLinea ? 'Editar Línea de Producto' : 'Nueva Línea de Producto'}
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
                      placeholder="Descripción de la línea de producto"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingLinea ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* AlertDialog para confirmar eliminación */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar línea de producto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres eliminar la línea "{deletingLinea?.nombre}"? 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={eliminarLinea} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          {lineas.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay líneas de producto</h3>
              <p className="text-gray-600">Crea tu primera línea de producto para organizar tus productos</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineas.map((linea, index) => (
                  <TableRow key={linea.id}>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-500">{linea.orden}</span>
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cambiarOrden(linea.id, 'up')}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cambiarOrden(linea.id, 'down')}
                            disabled={index === lineas.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{linea.nombre}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {linea.descripcion || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={linea.activo ? "default" : "secondary"}>
                        {linea.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editarLinea(linea)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={linea.activo ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleActivoLinea(linea.id, linea.activo)}
                        >
                          {linea.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmarEliminarLinea(linea)}
                        >
                          <Trash2 className="w-4 h-4" />
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

export default AdminLineasProducto;
