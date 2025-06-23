
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Building2, Globe, MapPin } from 'lucide-react';
import { Contacto, Empresa } from '@/types';

interface ContactoEmpresasCardProps {
  contacto: Contacto;
  productora?: Empresa;
  clienteFinal?: Empresa;
}

const ContactoEmpresasCard: React.FC<ContactoEmpresasCardProps> = ({ 
  contacto, 
  productora, 
  clienteFinal 
}) => {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-900 flex items-center">
          <User className="w-5 h-5 mr-2 text-slate-600" />
          Contacto y Empresas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contacto Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Contacto Principal</h3>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="space-y-2">
              <div>
                <p className="font-medium text-slate-900">{contacto.nombre} {contacto.apellido}</p>
                {contacto.cargo && (
                  <p className="text-xs text-slate-600">{contacto.cargo}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center text-slate-700">
                  <Mail className="w-3 h-3 mr-2 text-slate-500" />
                  <span className="text-xs">{contacto.email}</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Phone className="w-3 h-3 mr-2 text-slate-500" />
                  <span className="text-xs">{contacto.telefono}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empresas Section */}
        {(productora || clienteFinal) && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
              <Building2 className="w-4 h-4 mr-1 text-slate-600" />
              Empresas
            </h3>
            
            <div className="space-y-3">
              {productora && (
                <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-3">
                  <div className="mb-1">
                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                      Productora
                    </span>
                  </div>
                  <h4 className="font-medium text-slate-900 text-sm mb-1">{productora.nombre}</h4>
                  <div className="space-y-1 text-xs text-slate-600">
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
                <div className="border-l-4 border-green-500 bg-green-50 rounded-r-lg p-3">
                  <div className="mb-1">
                    <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
                      Cliente Final
                    </span>
                  </div>
                  <h4 className="font-medium text-slate-900 text-sm mb-1">{clienteFinal.nombre}</h4>
                  <div className="space-y-1 text-xs text-slate-600">
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

export default ContactoEmpresasCard;
