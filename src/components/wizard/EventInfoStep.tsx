import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TIPOS_EVENTO } from '@/types';
import { EventoData } from './types';

interface EventInfoStepProps {
  evento: EventoData;
  setEvento: (evento: EventoData) => void;
  fechaCierre: string;
  setFechaCierre: (fecha: string) => void;
  isCreating: boolean;
  onPrevious: () => void;
  onFinish: () => Promise<void>;
}

export const EventInfoStep: React.FC<EventInfoStepProps> = ({
  evento,
  setEvento,
  fechaCierre,
  setFechaCierre,
  isCreating,
  onPrevious,
  onFinish
}) => {
  const validarPaso = () => {
    return evento.tipo_evento && evento.nombre_evento && evento.fecha_evento && evento.locacion;
  };

  const handleFinish = async () => {
    if (!validarPaso()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    await onFinish();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipoEvento">Tipo de Evento *</Label>
          <Select value={evento.tipo_evento} onValueChange={(value) => setEvento({...evento, tipo_evento: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione el tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_EVENTO.map((tipo) => (
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
            value={evento.nombre_evento}
            onChange={(e) => setEvento({...evento, nombre_evento: e.target.value})}
            placeholder="Nombre del evento"
          />
        </div>
        
        <div>
          <Label htmlFor="fechaEvento">Fecha del Evento *</Label>
          <Input
            id="fechaEvento"
            type="date"
            value={evento.fecha_evento}
            onChange={(e) => setEvento({...evento, fecha_evento: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="fechaEventoFin">Fecha de Fin del Evento</Label>
          <Input
            id="fechaEventoFin"
            type="date"
            value={evento.fecha_evento_fin}
            onChange={(e) => setEvento({...evento, fecha_evento_fin: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="horarioInicio">Horario de Inicio</Label>
          <Input
            id="horarioInicio"
            type="time"
            value={evento.horario_inicio}
            onChange={(e) => setEvento({...evento, horario_inicio: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="horarioFin">Horario de Fin</Label>
          <Input
            id="horarioFin"
            type="time"
            value={evento.horario_fin}
            onChange={(e) => setEvento({...evento, horario_fin: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="cantidadAsistentes">Cantidad de Asistentes</Label>
          <Input
            id="cantidadAsistentes"
            type="number"
            min="0"
            value={evento.cantidad_asistentes}
            onChange={(e) => setEvento({...evento, cantidad_asistentes: e.target.value})}
            placeholder="0"
          />
        </div>
        
        <div>
          <Label htmlFor="cantidadInvitados">Cantidad de Invitados</Label>
          <Input
            id="cantidadInvitados"
            type="number"
            min="0"
            value={evento.cantidad_invitados}
            onChange={(e) => setEvento({...evento, cantidad_invitados: e.target.value})}
            placeholder="0"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="locacion">Locación *</Label>
          <Input
            id="locacion"
            value={evento.locacion}
            onChange={(e) => setEvento({...evento, locacion: e.target.value})}
            placeholder="Lugar donde se realizará el evento"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="fechaCierre">Fecha de Cierre Deseada</Label>
          <Input
            id="fechaCierre"
            type="date"
            value={fechaCierre}
            onChange={(e) => setFechaCierre(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between space-x-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isCreating}
          className="w-32"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          type="button"
          onClick={handleFinish}
          disabled={isCreating || !validarPaso()}
          className="w-40"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creando...
            </>
          ) : (
            'Crear Negocio'
          )}
        </Button>
      </div>
    </div>
  );
};