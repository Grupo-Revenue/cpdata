import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Negocio } from '@/types';

interface PDFClientEventInfoProps {
  negocio: Negocio;
}

const PDFClientEventInfo: React.FC<PDFClientEventInfoProps> = ({ negocio }) => {
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-1">
          INFORMACIÓN DEL CLIENTE
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">Contacto: </span>
            {negocio.contacto.nombre} {negocio.contacto.apellido}
          </div>
          <div>
            <span className="font-semibold">Email: </span>
            {negocio.contacto.email}
          </div>
          <div>
            <span className="font-semibold">Teléfono: </span>
            {negocio.contacto.telefono}
          </div>
          {negocio.productora && (
            <div>
              <span className="font-semibold">Productora: </span>
              {negocio.productora.nombre}
            </div>
          )}
          {negocio.clienteFinal && (
            <div>
              <span className="font-semibold">Cliente Final: </span>
              {negocio.clienteFinal.nombre}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-1">
          INFORMACIÓN DEL EVENTO
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">Evento: </span>
            {negocio.evento.nombreEvento}
          </div>
          <div>
            <span className="font-semibold">Tipo: </span>
            {negocio.evento.tipoEvento}
          </div>
          <div>
            <span className="font-semibold">Fecha: </span>
            {negocio.evento.fechaEvento ? formatearFecha(negocio.evento.fechaEvento) : 'Por definir'}
          </div>
          <div>
            <span className="font-semibold">Locación: </span>
            {negocio.evento.locacion}
          </div>
          <div>
            <span className="font-semibold">Asistentes: </span>
            {negocio.evento.cantidadAsistentes}
          </div>
          <div>
            <span className="font-semibold">Invitados: </span>
            {negocio.evento.cantidadInvitados}
          </div>
          <div>
            <span className="font-semibold">Horas Acreditación: </span>
            {negocio.evento.horasAcreditacion}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFClientEventInfo;