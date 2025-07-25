import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductNumberInput from './ProductNumberInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Calendar, Calculator } from 'lucide-react';
import { SessionAcreditacion } from '@/types';
import { useAccreditationSessions } from '@/hooks/useAccreditationSessions';
import { formatearPrecio } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import SessionPriceCalculatorDialog from './SessionPriceCalculatorDialog';

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
    getTotalAccreditors,
    setSessions
  } = useAccreditationSessions(externalSessions);

  // Ref to track if we're updating internally to avoid infinite loops
  const isInternalUpdate = useRef(false);
  const lastExternalSessions = useRef<SessionAcreditacion[]>(externalSessions);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionAcreditacion | null>(null);
  const [formData, setFormData] = useState({
    fecha: '',
    servicio: '',
    acreditadores: 0,
    supervisor: 0,
    observacion: '',
    precio: 0
  });

  // Deep comparison function for sessions arrays
  const sessionsAreEqual = useCallback((a: SessionAcreditacion[], b: SessionAcreditacion[]) => {
    if (a.length !== b.length) return false;
    return a.every((sessionA, index) => {
      const sessionB = b[index];
      return sessionA.id === sessionB.id &&
             sessionA.fecha === sessionB.fecha &&
             sessionA.servicio === sessionB.servicio &&
             sessionA.acreditadores === sessionB.acreditadores &&
             sessionA.supervisor === sessionB.supervisor &&
             sessionA.observacion === sessionB.observacion &&
             sessionA.precio === sessionB.precio &&
             sessionA.monto === sessionB.monto;
    });
  }, []);

  // Sync internal sessions with external changes (only when external changes come from outside)
  React.useEffect(() => {
    if (!isInternalUpdate.current && !sessionsAreEqual(externalSessions, lastExternalSessions.current)) {
      console.log('AccreditationSessionsManager: Syncing external sessions to internal:', externalSessions);
      setSessions(externalSessions);
      lastExternalSessions.current = externalSessions;
    }
  }, [externalSessions, setSessions, sessionsAreEqual]);

  // Notify parent of internal changes (only when changes are truly internal)
  React.useEffect(() => {
    if (!sessionsAreEqual(sessions, lastExternalSessions.current)) {
      console.log('AccreditationSessionsManager: Notifying parent of internal sessions change:', sessions);
      isInternalUpdate.current = true;
      onSessionsChange(sessions);
      lastExternalSessions.current = [...sessions];
      
      // Reset the flag after a microtask to allow the parent to update
      Promise.resolve().then(() => {
        isInternalUpdate.current = false;
      });
    }
  }, [sessions, onSessionsChange, sessionsAreEqual]);

  const resetForm = () => {
    setFormData({
      fecha: '',
      servicio: '',
      acreditadores: 0,
      supervisor: 0,
      observacion: '',
      precio: 0
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
      precio: session.precio
    });
    setIsDialogOpen(true);
  };

  const handleCalculatorResult = (result: {
    precio: number;
    acreditadores: number;
    supervisor: number;
  }) => {
    setFormData({
      ...formData,
      precio: result.precio,
      acreditadores: result.acreditadores,
      supervisor: result.supervisor
    });
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
                      <Label htmlFor="precio">Precio *</Label>
                      <div className="flex gap-2">
                        <ProductNumberInput
                          value={formData.precio}
                          onChange={(value) => setFormData({ ...formData, precio: value })}
                          min={0}
                          step={0.01}
                          allowEmpty={true}
                          placeholder="0"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCalculatorOpen(true)}
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </div>
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
                      <ProductNumberInput
                        value={formData.acreditadores}
                        onChange={(value) => setFormData({ ...formData, acreditadores: Math.floor(value) })}
                        min={0}
                        step={1}
                        allowEmpty={true}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supervisor">Supervisor</Label>
                      <ProductNumberInput
                        value={formData.supervisor}
                        onChange={(value) => setFormData({ ...formData, supervisor: Math.floor(value) })}
                        min={0}
                        step={1}
                        allowEmpty={true}
                        placeholder="0"
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
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
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
                      <TableCell className="text-right">
                        {formatearPrecio(session.precio)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatearPrecio(session.monto)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsCalculatorOpen(true)}
                            title="Usar calculadora"
                          >
                            <Calculator className="h-3 w-3" />
                          </Button>
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
                Total Acreditadores: <span className="font-medium">{getTotalAccreditors()}</span>
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

      <SessionPriceCalculatorDialog
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onApplyCalculation={handleCalculatorResult}
      />
    </Card>
  );
};

export default AccreditationSessionsManager;