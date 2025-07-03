import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { SessionAcreditacion } from '@/types';
import { useAccreditationSessions } from '@/hooks/useAccreditationSessions';
import { formatearPrecio } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';

interface AccreditationSessionsManagerProps {
  sessions: SessionAcreditacion[];
  onSessionsChange: (sessions: SessionAcreditacion[]) => void;
}

const SERVICIOS_ACREDITACION = [
  'Acreditación Manual',
  'Acreditación Express QR',
  'Acreditación Mixta',
  'Supervisión General',
  'Coordinación de Acceso'
];

const AccreditationSessionsManager: React.FC<AccreditationSessionsManagerProps> = ({
  sessions: externalSessions,
  onSessionsChange
}) => {
  const { toast } = useToast();
  const {
    sessions,
    addSession,
    updateSession,
    removeSession,
    getTotalAmount,
    getTotalQuantity,
    setSessions
  } = useAccreditationSessions(externalSessions);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionAcreditacion | null>(null);
  const [formData, setFormData] = useState({
    fecha: '',
    servicio: '',
    acreditadores: 0,
    supervisor: 0,
    observacion: '',
    cantidad: 1
  });

  // Sync internal sessions with external changes
  React.useEffect(() => {
    setSessions(externalSessions);
  }, [externalSessions, setSessions]);

  // Notify parent of changes
  React.useEffect(() => {
    onSessionsChange(sessions);
  }, [sessions, onSessionsChange]);

  const resetForm = () => {
    setFormData({
      fecha: '',
      servicio: '',
      acreditadores: 0,
      supervisor: 0,
      observacion: '',
      cantidad: 1
    });
    setEditingSession(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fecha || !formData.servicio) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete la fecha y el servicio",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingSession) {
        updateSession(editingSession.id, formData);
        toast({
          title: "Éxito",
          description: "Jornada actualizada correctamente"
        });
      } else {
        addSession(formData);
        toast({
          title: "Éxito", 
          description: "Jornada agregada correctamente"
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar la jornada",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (session: SessionAcreditacion) => {
    setEditingSession(session);
    setFormData({
      fecha: session.fecha,
      servicio: session.servicio,
      acreditadores: session.acreditadores,
      supervisor: session.supervisor,
      observacion: session.observacion || '',
      cantidad: session.cantidad
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (sessionId: string) => {
    if (confirm('¿Está seguro de eliminar esta jornada?')) {
      removeSession(sessionId);
      toast({
        title: "Jornada eliminada",
        description: "La jornada ha sido eliminada correctamente"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Jornadas de Acreditación
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Gestiona las sesiones de acreditación para este producto
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Jornada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingSession ? 'Editar Jornada' : 'Nueva Jornada'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fecha">Fecha *</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cantidad">Cantidad *</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        min="1"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="servicio">Servicio *</Label>
                    <Select value={formData.servicio} onValueChange={(value) => setFormData({ ...formData, servicio: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICIOS_ACREDITACION.map((servicio) => (
                          <SelectItem key={servicio} value={servicio}>
                            {servicio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="acreditadores">Acreditadores</Label>
                      <Input
                        id="acreditadores"
                        type="number"
                        min="0"
                        value={formData.acreditadores}
                        onChange={(e) => setFormData({ ...formData, acreditadores: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="supervisor">Supervisor</Label>
                      <Input
                        id="supervisor"
                        type="number"
                        min="0"
                        value={formData.supervisor}
                        onChange={(e) => setFormData({ ...formData, supervisor: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observacion">Observación</Label>
                    <Textarea
                      id="observacion"
                      value={formData.observacion}
                      onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                      placeholder="Comentarios adicionales..."
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSession ? 'Actualizar' : 'Agregar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {sessions.length > 0 ? (
          <>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-center">Acred.</TableHead>
                    <TableHead className="text-center">Sup.</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {new Date(session.fecha).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell>{session.servicio}</TableCell>
                      <TableCell className="text-center">{session.acreditadores}</TableCell>
                      <TableCell className="text-center">{session.supervisor}</TableCell>
                      <TableCell className="text-center">{session.cantidad}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatearPrecio(session.monto)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(session)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end space-x-4 text-sm border-t pt-3">
              <div className="text-muted-foreground">
                Total Cantidad: <span className="font-medium">{getTotalQuantity()}</span>
              </div>
              <div className="text-muted-foreground">
                Total Monto: <span className="font-medium">{formatearPrecio(getTotalAmount())}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay jornadas agregadas</p>
            <p className="text-xs">Haz clic en "Agregar Jornada" para comenzar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccreditationSessionsManager;