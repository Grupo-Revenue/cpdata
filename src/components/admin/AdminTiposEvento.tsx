import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TipoEvento {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  created_at: string;
}

export function AdminTiposEvento() {
  const [tipos, setTipos] = useState<TipoEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoEvento | null>(null);
  const [deletingTipo, setDeletingTipo] = useState<TipoEvento | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: ""
  });
  const { toast } = useToast();

  const cargarTipos = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_evento')
        .select('*')
        .order('orden', { ascending: true });

      if (error) throw error;
      setTipos(data || []);
    } catch (error) {
      console.error('Error cargando tipos de evento:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tipos de evento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTipos();
  }, []);

  const resetForm = () => {
    setFormData({ nombre: "", descripcion: "" });
    setEditingTipo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTipo) {
        const { error } = await supabase
          .from('tipos_evento')
          .update({
            nombre: formData.nombre.trim(),
            descripcion: formData.descripcion.trim() || null,
          })
          .eq('id', editingTipo.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Tipo de evento actualizado correctamente",
        });
      } else {
        const maxOrden = tipos.length > 0 ? Math.max(...tipos.map(t => t.orden)) : 0;
        
        const { error } = await supabase
          .from('tipos_evento')
          .insert({
            nombre: formData.nombre.trim(),
            descripcion: formData.descripcion.trim() || null,
            orden: maxOrden + 1,
          });

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Tipo de evento creado correctamente",
        });
      }

      setDialogOpen(false);
      resetForm();
      cargarTipos();
    } catch (error: any) {
      console.error('Error guardando tipo de evento:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "Ya existe un tipo de evento con ese nombre",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo guardar el tipo de evento",
          variant: "destructive",
        });
      }
    }
  };

  const toggleActivoTipo = async (id: string, activoActual: boolean) => {
    try {
      // Verificar que no quede sin tipos activos
      if (activoActual) {
        const tiposActivos = tipos.filter(t => t.activo && t.id !== id);
        if (tiposActivos.length === 0) {
          toast({
            title: "Error",
            description: "Debe mantener al menos un tipo de evento activo",
            variant: "destructive",
          });
          return;
        }
      }

      const { error } = await supabase
        .from('tipos_evento')
        .update({ activo: !activoActual })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Tipo de evento ${!activoActual ? 'activado' : 'desactivado'} correctamente`,
      });
      
      cargarTipos();
    } catch (error) {
      console.error('Error cambiando estado del tipo:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del tipo de evento",
        variant: "destructive",
      });
    }
  };

  const cambiarOrden = async (id: string, direccion: 'arriba' | 'abajo') => {
    const tipo = tipos.find(t => t.id === id);
    if (!tipo) return;

    const otroTipo = tipos.find(t => 
      direccion === 'arriba' 
        ? t.orden === tipo.orden - 1 
        : t.orden === tipo.orden + 1
    );

    if (!otroTipo) return;

    try {
      const { error: error1 } = await supabase
        .from('tipos_evento')
        .update({ orden: otroTipo.orden })
        .eq('id', tipo.id);

      const { error: error2 } = await supabase
        .from('tipos_evento')
        .update({ orden: tipo.orden })
        .eq('id', otroTipo.id);

      if (error1 || error2) throw error1 || error2;

      cargarTipos();
    } catch (error) {
      console.error('Error cambiando orden:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el orden",
        variant: "destructive",
      });
    }
  };

  const editarTipo = (tipo: TipoEvento) => {
    setEditingTipo(tipo);
    setFormData({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || ""
    });
    setDialogOpen(true);
  };

  const confirmarEliminarTipo = async (tipo: TipoEvento) => {
    try {
      // Verificar si hay negocios que usan este tipo
      const { data: negocios, error } = await supabase
        .from('negocios')
        .select('id')
        .eq('tipo_evento', tipo.nombre)
        .limit(1);

      if (error) throw error;

      if (negocios && negocios.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: `No se puede eliminar el tipo "${tipo.nombre}" porque está siendo usado por uno o más negocios.`,
          variant: "destructive",
        });
        return;
      }

      setDeletingTipo(tipo);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error verificando uso del tipo:', error);
      toast({
        title: "Error",
        description: "Error al verificar si el tipo está en uso",
        variant: "destructive",
      });
    }
  };

  const eliminarTipo = async () => {
    if (!deletingTipo) return;

    try {
      const { error } = await supabase
        .from('tipos_evento')
        .delete()
        .eq('id', deletingTipo.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Tipo de evento eliminado correctamente",
      });

      setDeleteDialogOpen(false);
      setDeletingTipo(null);
      cargarTipos();
    } catch (error) {
      console.error('Error eliminando tipo:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el tipo de evento",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Tipos de Evento</CardTitle>
            <CardDescription>
              Gestiona los tipos de evento disponibles en el sistema
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Tipo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTipo ? 'Editar Tipo de Evento' : 'Nuevo Tipo de Evento'}
                </DialogTitle>
                <DialogDescription>
                  {editingTipo 
                    ? 'Modifica los datos del tipo de evento' 
                    : 'Completa los datos para crear un nuevo tipo de evento'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Congreso"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción opcional del tipo de evento"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTipo ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tipos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No hay tipos de evento configurados
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer tipo
                </Button>
              </DialogTrigger>
            </Dialog>
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
              {tipos.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{tipo.orden}</span>
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => cambiarOrden(tipo.id, 'arriba')}
                          disabled={tipo.orden === 1}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => cambiarOrden(tipo.id, 'abajo')}
                          disabled={tipo.orden === tipos.length}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{tipo.nombre}</TableCell>
                  <TableCell>{tipo.descripcion || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tipo.activo 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {tipo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editarTipo(tipo)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={tipo.activo ? "secondary" : "default"}
                        size="sm"
                        onClick={() => toggleActivoTipo(tipo.id, tipo.activo)}
                      >
                        {tipo.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmarEliminarTipo(tipo)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el tipo de evento 
              "{deletingTipo?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setDeletingTipo(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={eliminarTipo}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}