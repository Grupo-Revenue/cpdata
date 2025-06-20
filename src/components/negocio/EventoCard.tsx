
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin } from 'lucide-react';
import { Evento } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventoCardProps {
  evento: Evento;
}

const EventoCard: React.FC<EventoCardProps> = ({ evento }) => {
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Información del Evento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Tipo de Evento</p>
            <p>{evento.tipoEvento}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Fecha</p>
            <p>{evento.fechaEvento ? formatearFecha(evento.fechaEvento) : 'Por definir'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Horas de Acreditación</p>
            <p>{evento.horasAcreditacion}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Asistentes Esperados</p>
            <p>{evento.cantidadAsistentes}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Invitados</p>
            <p>{evento.cantidadInvitados}</p>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium text-gray-600">Locación</p>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <p>{evento.locacion}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventoCard;
