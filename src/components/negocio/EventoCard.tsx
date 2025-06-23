
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users, Clock, Star } from 'lucide-react';
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
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-slate-600" />
          Información del Evento
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Event name and type */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-slate-900">{evento.nombreEvento}</h3>
            <div className="flex items-center bg-slate-100 px-2 py-1 rounded-full">
              <Star className="w-3 h-3 mr-1 text-slate-600" />
              <span className="text-xs font-medium text-slate-700">{evento.tipoEvento}</span>
            </div>
          </div>
        </div>

        {/* Main event details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Fecha */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Calendar className="w-4 h-4 text-slate-600 mr-1" />
              <span className="text-xs font-medium text-slate-700">Fecha</span>
            </div>
            {evento.fechaEvento ? (
              <p className="font-semibold text-slate-900 text-sm">{formatearFecha(evento.fechaEvento)}</p>
            ) : (
              <p className="text-slate-500 italic text-sm">Por definir</p>
            )}
          </div>

          {/* Horas de acreditación */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Clock className="w-4 h-4 text-slate-600 mr-1" />
              <span className="text-xs font-medium text-slate-700">Acreditación</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">{evento.horasAcreditacion}</p>
          </div>

          {/* Asistentes */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Users className="w-4 h-4 text-slate-600 mr-1" />
              <span className="text-xs font-medium text-slate-700">Asistentes</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">{evento.cantidadAsistentes.toLocaleString()}</p>
          </div>

          {/* Invitados */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Users className="w-4 h-4 text-slate-600 mr-1" />
              <span className="text-xs font-medium text-slate-700">Invitados</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">{evento.cantidadInvitados.toLocaleString()}</p>
          </div>
        </div>

        {/* Location */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center mb-1">
            <MapPin className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-xs font-medium text-slate-700">Ubicación</span>
          </div>
          <p className="font-semibold text-slate-900 text-sm">{evento.locacion}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventoCard;
