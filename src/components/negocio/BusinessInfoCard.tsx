
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UsersIcon, 
  ClockIcon, 
  Edit3Icon, 
  CheckIcon, 
  XIcon,
  User,
  Mail,
  Phone,
  Building2,
  Globe
} from 'lucide-react';
import { Negocio } from '@/types';
import { useNegocio } from '@/context/NegocioContext';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import { toast } from '@/hooks/use-toast';

interface BusinessInfoCardProps {
  negocio: Negocio;
}

const BusinessInfoCard: React.FC<BusinessInfoCardProps> = ({ negocio }) => {
  const { actualizarNegocio } = useNegocio();
  const { syncToHubSpot } = useBidirectionalSync();
  const [editandoFechaCierre, setEditandoFechaCierre] = useState(false);
  const [fechaCierreTemp, setFechaCierreTemp] = useState(negocio.fechaCierre || '');

  const handleSaveFechaCierre = async () => {
    try {
      await actualizarNegocio(negocio.id, { fechaCierre: fechaCierreTemp });
      await syncToHubSpot(negocio.id);
      setEditandoFechaCierre(false);
      toast({
        title: "Fecha actualizada",
        description: "La fecha de cierre se ha actualizado correctamente"
      });
    } catch (error) {
      console.error('Error updating close date:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la fecha de cierre",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setFechaCierreTemp(negocio.fechaCierre || '');
    setEditandoFechaCierre(false);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
          <CalendarIcon className="w-4 h-4 mr-2 text-slate-600" />
          Información del Negocio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Section */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <Badge variant="outline" className="text-xs mr-2">
              {negocio.evento.tipoEvento}
            </Badge>
            <h3 className="font-medium text-sm text-gray-900">{negocio.evento.nombreEvento}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center">
              <CalendarIcon className="w-3 h-3 mr-1" />
              <span>{new Date(negocio.evento.fechaEvento).toLocaleDateString('es-CL')}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-3 h-3 mr-1" />
              <span>{negocio.evento.horasAcreditacion}</span>
            </div>
            <div className="flex items-center">
              <MapPinIcon className="w-3 h-3 mr-1" />
              <span className="truncate">{negocio.evento.locacion}</span>
            </div>
            <div className="flex items-center">
              <UsersIcon className="w-3 h-3 mr-1" />
              <span>{negocio.evento.cantidadAsistentes.toLocaleString()} asistentes</span>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-blue-50 rounded-lg p-3">
          <h4 className="font-medium text-sm text-blue-900 mb-2 flex items-center">
            <User className="w-3 h-3 mr-1" />
            Contacto Principal
          </h4>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {negocio.contacto.nombre} {negocio.contacto.apellido}
            </p>
            {negocio.contacto.cargo && (
              <p className="text-xs text-slate-600">{negocio.contacto.cargo}</p>
            )}
            <div className="flex flex-col space-y-1 text-xs text-slate-600">
              <div className="flex items-center">
                <Mail className="w-3 h-3 mr-1" />
                <span>{negocio.contacto.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-3 h-3 mr-1" />
                <span>{negocio.contacto.telefono}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        {(negocio.productora || negocio.clienteFinal) && (
          <div className="space-y-2">
            {negocio.productora && (
              <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                    Productora
                  </span>
                </div>
                <h5 className="font-medium text-sm text-slate-900 mb-1">{negocio.productora.nombre}</h5>
                <div className="text-xs text-slate-600 space-y-1">
                  {negocio.productora.rut && <p>RUT: {negocio.productora.rut}</p>}
                  {negocio.productora.sitio_web && (
                    <div className="flex items-center">
                      <Globe className="w-3 h-3 mr-1" />
                      <span>{negocio.productora.sitio_web}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {negocio.clienteFinal && (
              <div className="border-l-4 border-green-500 bg-green-50 rounded-r-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
                    Cliente Final
                  </span>
                </div>
                <h5 className="font-medium text-sm text-slate-900 mb-1">{negocio.clienteFinal.nombre}</h5>
                <div className="text-xs text-slate-600 space-y-1">
                  {negocio.clienteFinal.rut && <p>RUT: {negocio.clienteFinal.rut}</p>}
                  {negocio.clienteFinal.sitio_web && (
                    <div className="flex items-center">
                      <Globe className="w-3 h-3 mr-1" />
                      <span>{negocio.clienteFinal.sitio_web}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close Date Field */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-600 font-medium">
              Fecha de Cierre Esperada
            </div>
            {!editandoFechaCierre && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditandoFechaCierre(true)}
                className="h-5 w-5 p-0"
              >
                <Edit3Icon className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          {editandoFechaCierre ? (
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={fechaCierreTemp}
                onChange={(e) => setFechaCierreTemp(e.target.value)}
                className="flex-1 h-7 text-xs"
              />
              <Button
                size="sm"
                onClick={handleSaveFechaCierre}
                className="h-7 w-7 p-0"
              >
                <CheckIcon className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-7 w-7 p-0"
              >
                <XIcon className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-900">
              {negocio.fechaCierre 
                ? new Date(negocio.fechaCierre).toLocaleDateString('es-CL')
                : 'Sin fecha definida'
              }
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessInfoCard;
