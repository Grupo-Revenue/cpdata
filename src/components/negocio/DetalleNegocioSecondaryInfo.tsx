
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Building2, Globe, MapPin, Calendar, Clock, Users, Star } from 'lucide-react';
import { Contacto, Empresa, Evento } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DetalleNegocioSecondaryInfoProps {
  contacto: Contacto;
  productora?: Empresa;
  clienteFinal?: Empresa;
  evento: Evento;
}

const DetalleNegocioSecondaryInfo: React.FC<DetalleNegocioSecondaryInfoProps> = ({ 
  contacto, 
  productora, 
  clienteFinal,
  evento
}) => {
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-slate-900 flex items-center">
          <User className="w-5 h-5 mr-2 text-slate-600" />
          Información Adicional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact */}
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-3">Contacto Principal</h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-900">{contacto.nombre} {contacto.apellido}</p>
                {contacto.cargo && (
                  <p className="text-sm text-slate-600">{contacto.cargo}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center text-slate-700">
                <Mail className="w-4 h-4 mr-2 text-slate-500" />
                <span>{contacto.email}</span>
              </div>
              <div className="flex items-center text-slate-700">
                <Phone className="w-4 h-4 mr-2 text-slate-500" />
                <span>{contacto.telefono}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-3">Detalles del Evento</h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-900">{evento.nombreEvento}</h4>
                <div className="flex items-center mt-1">
                  <Star className="w-3 h-3 mr-1 text-slate-600" />
                  <span className="text-sm text-slate-600">{evento.tipoEvento}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 text-slate-600 mr-2" />
                <div>
                  <p className="text-xs text-slate-600">Fecha</p>
                  <p className="font-medium text-slate-900">
                    {evento.fechaEvento ? formatearFecha(evento.fechaEvento) : 'Por definir'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-3 h-3 text-slate-600 mr-2" />
                <div>
                  <p className="text-xs text-slate-600">Acreditación</p>
                  <p className="font-medium text-slate-900">{evento.horasAcreditacion}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="w-3 h-3 text-slate-600 mr-2" />
                <div>
                  <p className="text-xs text-slate-600">Asistentes</p>
                  <p className="font-medium text-slate-900">{evento.cantidadAsistentes.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="w-3 h-3 text-slate-600 mr-2" />
                <div>
                  <p className="text-xs text-slate-600">Invitados</p>
                  <p className="font-medium text-slate-900">{evento.cantidadInvitados.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-center">
                <MapPin className="w-3 h-3 text-red-500 mr-2" />
                <span className="text-sm font-medium text-slate-900">{evento.locacion}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Companies */}
        {(productora || clienteFinal) && (
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-slate-600" />
              Empresas Involucradas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productora && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Productora
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">{productora.nombre}</h4>
                  <div className="space-y-1 text-xs text-slate-700">
                    {productora.rut && (
                      <p><span className="font-medium">RUT:</span> {productora.rut}</p>
                    )}
                    {productora.sitioWeb && (
                      <div className="flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        <span>{productora.sitioWeb}</span>
                      </div>
                    )}
                    {productora.direccion && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{productora.direccion}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {clienteFinal && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                      Cliente Final
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">{clienteFinal.nombre}</h4>
                  <div className="space-y-1 text-xs text-slate-700">
                    {clienteFinal.rut && (
                      <p><span className="font-medium">RUT:</span> {clienteFinal.rut}</p>
                    )}
                    {clienteFinal.sitioWeb && (
                      <div className="flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        <span>{clienteFinal.sitioWeb}</span>
                      </div>
                    )}
                    {clienteFinal.direccion && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{clienteFinal.direccion}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DetalleNegocioSecondaryInfo;
