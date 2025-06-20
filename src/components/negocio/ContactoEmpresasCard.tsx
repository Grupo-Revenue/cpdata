
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
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl">
          <User className="w-6 h-6 mr-3 text-blue-600" />
          Contacto y Empresas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contacto Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Contacto Principal</h3>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-900">{contacto.nombre} {contacto.apellido}</p>
              {contacto.cargo && (
                <p className="text-sm text-gray-600 mt-1">{contacto.cargo}</p>
              )}
            </div>
            
            <div className="flex items-center text-sm text-gray-700">
              <Mail className="w-4 h-4 mr-3 text-blue-500" />
              <span>{contacto.email}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-700">
              <Phone className="w-4 h-4 mr-3 text-green-500" />
              <span>{contacto.telefono}</span>
            </div>
          </div>
        </div>

        {/* Empresas Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-purple-600" />
            Empresas Involucradas
          </h3>
          
          <div className="space-y-4">
            {productora && (
              <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">
                    Productora
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{productora.nombre}</h4>
                <div className="space-y-1 text-sm text-gray-600">
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
              <div className="border-l-4 border-green-500 bg-green-50 rounded-r-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 uppercase tracking-wide">
                    Cliente Final
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{clienteFinal.nombre}</h4>
                <div className="space-y-1 text-sm text-gray-600">
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

            {!productora && !clienteFinal && (
              <div className="text-center py-6 text-gray-500">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No hay empresas asociadas</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactoEmpresasCard;
