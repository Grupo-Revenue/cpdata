import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Negocio } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negocio: Negocio;
  onSave: (eventData: {
    tipo_evento?: string;
    nombre_evento?: string;
    fecha_evento?: string;
    cantidad_asistentes?: number;
    cantidad_invitados?: number;
    locacion?: string;
    horas_acreditacion?: string;
    fecha_cierre?: string;
  }) => Promise<void>;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  open,
  onOpenChange,
  negocio,
  onSave
}) => {
  const [formData, setFormData] = useState({
    tipo_evento: negocio.tipo_evento,
    nombre_evento: negocio.nombre_evento,
    fecha_evento: negocio.fecha_evento || '',
    cantidad_asistentes: negocio.cantidad_asistentes || 0,
    cantidad_invitados: negocio.cantidad_invitados || 0,
    locacion: negocio.locacion,
    horas_acreditacion: negocio.horas_acreditacion,
    fecha_cierre: negocio.fecha_cierre || ''
  });

  const [tiposEvento, setTiposEvento] = useState<string[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load event types from database
  useEffect(() => {
    const cargarTiposEvento = async () => {
      try {
        const { data, error } = await supabase
          .from('tipos_evento')
          .select('nombre')
          .eq('activo', true)
          .order('orden', { ascending: true });

        if (error) throw error;
        
        setTiposEvento(data?.map(tipo => tipo.nombre) || []);
      } catch (error) {
        console.error('Error cargando tipos de evento:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los tipos de evento",
          variant: "destructive"
        });
        setTiposEvento(['Congreso', 'Seminario', 'Workshop', 'Conferencia', 'Otro']);
      } finally {
        setLoadingTipos(false);
      }
    };

    if (open) {
      cargarTiposEvento();
      // Reset form data when opening
      setFormData({
        tipo_evento: negocio.tipo_evento,
        nombre_evento: negocio.nombre_evento,
        fecha_evento: negocio.fecha_evento || '',
        cantidad_asistentes: negocio.cantidad_asistentes || 0,
        cantidad_invitados: negocio.cantidad_invitados || 0,
        locacion: negocio.locacion,
        horas_acreditacion: negocio.horas_acreditacion,
        fecha_cierre: negocio.fecha_cierre || ''
      });
    }
  }, [open, negocio]);

  const isValid = () => {
    return formData.tipo_evento && formData.nombre_evento && formData.fecha_evento && formData.locacion;
  };

  const handleSave = async () => {
    if (!isValid()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <Label htmlFor="tipoEvento">Tipo de Evento *</Label>
            <Select 
              value={formData.tipo_evento} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_evento: value }))}
              disabled={loadingTipos}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTipos ? "Cargando..." : "Seleccione el tipo de evento"} />
              </SelectTrigger>
              <SelectContent>
                {tiposEvento.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="nombreEvento">Nombre del Evento *</Label>
            <Input
              id="nombreEvento"
              value={formData.nombre_evento}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre_evento: e.target.value }))}
              placeholder="Nombre del evento"
            />
          </div>
          
          <div>
            <Label htmlFor="fechaEvento">Fecha del Evento *</Label>
            <Input
              id="fechaEvento"
              type="date"
              value={formData.fecha_evento}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_evento: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="horasAcreditacion">Horas de Acreditación</Label>
            <Input
              id="horasAcreditacion"
              value={formData.horas_acreditacion}
              onChange={(e) => setFormData(prev => ({ ...prev, horas_acreditacion: e.target.value }))}
              placeholder="Ej: 8:00 - 18:00"
            />
          </div>
          
          <div>
            <Label htmlFor="cantidadAsistentes">Cantidad de Asistentes</Label>
            <Input
              id="cantidadAsistentes"
              type="number"
              min="0"
              value={formData.cantidad_asistentes}
              onChange={(e) => setFormData(prev => ({ ...prev, cantidad_asistentes: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>
          
          <div>
            <Label htmlFor="cantidadInvitados">Cantidad de Invitados</Label>
            <Input
              id="cantidadInvitados"
              type="number"
              min="0"
              value={formData.cantidad_invitados}
              onChange={(e) => setFormData(prev => ({ ...prev, cantidad_invitados: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="locacion">Locación *</Label>
            <Input
              id="locacion"
              value={formData.locacion}
              onChange={(e) => setFormData(prev => ({ ...prev, locacion: e.target.value }))}
              placeholder="Lugar donde se realizará el evento"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="fechaCierre">Fecha de Cierre Deseada</Label>
            <Input
              id="fechaCierre"
              type="date"
              value={formData.fecha_cierre}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_cierre: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isValid()}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
