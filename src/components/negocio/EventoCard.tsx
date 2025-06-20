
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

  const formatearFechaCompleta = (fecha: string) => {
    try {
      return format(new Date(fecha), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <Calendar className="w-6 h-6 mr-3" />
            Información del Evento
          </CardTitle>
        </CardHeader>
      </div>
      
      <CardContent className="p-6">
        {/* Event name and type */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-2xl font-bold text-gray-900">{evento.nombreEvento}</h3>
            <div className="flex items-center bg-purple-100 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 mr-2 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">{evento.tipoEvento}</span>
            </div>
          </div>
        </div>

        {/* Main event details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Fecha */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Fecha del Evento</span>
            </div>
            {evento.fechaEvento ? (
              <div>
                <p className="font-semibold text-gray-900">{formatearFecha(evento.fechaEvento)}</p>
                <p className="text-xs text-gray-600 mt-1">{formatearFechaCompleta(evento.fechaEvento)}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Por definir</p>
            )}
          </div>

          {/* Horas de acreditación */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Acreditación</span>
            </div>
            <p className="font-semibold text-gray-900">{evento.horasAcreditacion}</p>
          </div>

          {/* Asistentes */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-800">Asistentes</span>
            </div>
            <p className="font-semibold text-gray-900">{evento.cantidadAsistentes.toLocaleString()}</p>
            <p className="text-xs text-gray-600">personas esperadas</p>
          </div>

          {/* Invitados */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-800">Invitados</span>
            </div>
            <p className="font-semibold text-gray-900">{evento.cantidadInvitados.toLocaleString()}</p>
            <p className="text-xs text-gray-600">invitaciones especiales</p>
          </div>
        </div>

        {/* Location */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <MapPin className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-sm font-medium text-gray-800">Ubicación del Evento</span>
          </div>
          <p className="font-semibold text-gray-900">{evento.locacion}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventoCard;
