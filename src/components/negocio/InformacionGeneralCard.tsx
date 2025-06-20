
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Building2, Globe, MapPin, Calendar, Clock, Users, Star } from 'lucide-react';
import { Contacto, Empresa, Evento } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InformacionGeneralCardProps {
  contacto: Contacto;
  productora?: Empresa;
  clienteFinal?: Empresa;
  evento: Evento;
}

const InformacionGeneralCard: React.FC<InformacionGeneralCardProps> = ({ 
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

  const formatearFechaCompleta = (fecha: string) => {
    try {
      return format(new Date(fecha), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl text-slate-900 flex items-center">
          <User className="w-6 h-6 mr-3 text-slate-600" />
          Información General
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Contact Section */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Contacto Principal</h3>
          <div className="bg-slate-50 rounded-lg p-6 space-y-4">
            <div>
              <p className="font-semibold text-slate-900 text-lg">{contacto.nombre} {contacto.apellido}</p>
              {contacto.cargo && (
                <p className="text-slate-600 mt-1">{contacto.cargo}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-slate-700">
                <Mail className="w-4 h-4 mr-3 text-slate-500" />
                <span>{contacto.email}</span>
              </div>
              
              <div className="flex items-center text-slate-700">
                <Phone className="w-4 h-4 mr-3 text-slate-500" />
                <span>{contacto.telefono}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Section */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Información del Evento</h3>
          <div className="bg-slate-50 rounded-lg p-6">
            {/* Event name and type */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">{evento.nombreEvento}</h4>
                <div className="flex items-center bg-slate-200 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 mr-2 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">{evento.tipoEvento}</span>
                </div>
              </div>
            </div>

            {/* Event details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Fecha */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 text-slate-600 mr-2" />
                  <span className="text-sm font-medium text-slate-700">Fecha</span>
                </div>
                {evento.fechaEvento ? (
                  <div>
                    <p className="font-semibold text-slate-900">{formatearFecha(evento.fechaEvento)}</p>
                    <p className="text-xs text-slate-600 mt-1">{formatearFechaCompleta(evento.fechaEvento)}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Por definir</p>
                )}
              </div>

              {/* Horas de acreditación */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 text-slate-600 mr-2" />
                  <span className="text-sm font-medium text-slate-700">Acreditación</span>
                </div>
                <p className="font-semibold text-slate-900">{evento.horasAcreditacion}</p>
              </div>

              {/* Asistentes */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center mb-2">
                  <Users className="w-4 h-4 text-slate-600 mr-2" />
                  <span className="text-sm font-medium text-slate-700">Asistentes</span>
                </div>
                <p className="font-semibold text-slate-900">{evento.cantidadAsistentes.toLocaleString()}</p>
                <p className="text-xs text-slate-600">personas esperadas</p>
              </div>

              {/* Invitados */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center mb-2">
                  <Users className="w-4 h-4 text-slate-600 mr-2" />
                  <span className="text-sm font-medium text-slate-700">Invitados</span>
                </div>
                <p className="font-semibold text-slate-900">{evento.cantidadInvitados.toLocaleString()}</p>
                <p className="text-xs text-slate-600">invitaciones especiales</p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm font-medium text-slate-700">Ubicación</span>
              </div>
              <p className="font-semibold text-slate-900">{evento.locacion}</p>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        {(productora || clienteFinal) && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-slate-600" />
              Empresas Involucradas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {productora && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="mb-3">
                    <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                      Productora
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3 text-lg">{productora.nombre}</h4>
                  <div className="space-y-2 text-sm text-slate-700">
                    {productora.rut && (
                      <p><span className="font-medium">RUT:</span> {productora.rut}</p>
                    )}
                    {productora.sitioWeb && (
                      <div className="flex items-center">
                        <Globe className="w-3 h-3 mr-2" />
                        <span>{productora.sitioWeb}</span>
                      </div>
                    )}
                    {productora.direccion && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2" />
                        <span>{productora.direccion}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {clienteFinal && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                  <div className="mb-3">
                    <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                      Cliente Final
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3 text-lg">{clienteFinal.nombre}</h4>
                  <div className="space-y-2 text-sm text-slate-700">
                    {clienteFinal.rut && (
                      <p><span className="font-medium">RUT:</span> {clienteFinal.rut}</p>
                    )}
                    {clienteFinal.sitioWeb && (
                      <div className="flex items-center">
                        <Globe className="w-3 h-3 mr-2" />
                        <span>{clienteFinal.sitioWeb}</span>
                      </div>
                    )}
                    {clienteFinal.direccion && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2" />
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

export default InformacionGeneralCard;
