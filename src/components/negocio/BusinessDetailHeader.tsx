
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  User, 
  Building, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  RefreshCw,
  Plus,
  Phone,
  Mail
} from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';
import BusinessSyncStatus from '@/components/business/BusinessSyncStatus';

interface BusinessDetailHeaderProps {
  negocio: Negocio;
  onVolver: () => void;
  onCrearPresupuesto: () => void;
  onCambiarEstado?: (negocioId: string, nuevoEstado: string) => void;
}

const BusinessDetailHeader: React.FC<BusinessDetailHeaderProps> = ({
  negocio,
  onVolver,
  onCrearPresupuesto,
  onCambiarEstado
}) => {
  const valorTotal = calcularValorNegocio(negocio);
  const presupuestosAprobados = negocio.presupuestos.filter(p => p.estado === 'aprobado').length;
  const presupuestosEnviados = negocio.presupuestos.filter(p => p.estado === 'enviado').length;
  const empresaDisplay = negocio.productora?.nombre || negocio.clienteFinal?.nombre || 'Sin empresa';

  const handleStateChange = (negocioId: string, nuevoEstado: string) => {
    if (onCambiarEstado) {
      onCambiarEstado(negocioId, nuevoEstado);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onVolver}
            className="h-9 px-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">Negocio #{negocio.numero}</h1>
              <BusinessStateSelect
                negocio={negocio}
                onStateChange={handleStateChange}
                size="sm"
              />
            </div>
            <p className="text-lg text-slate-600 mt-1">{negocio.evento.nombreEvento}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Contact Info */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Contacto</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-800 font-medium">{negocio.contacto.nombre}</p>
              <div className="flex items-center space-x-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600">{negocio.contacto.telefono}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Building className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600 truncate">{empresaDisplay}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Info */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Evento</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600">
                  {negocio.evento.fechaEvento ? new Date(negocio.evento.fechaEvento).toLocaleDateString('es-CL') : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600 truncate">{negocio.evento.locacion}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600">{negocio.evento.cantidadAsistentes.toLocaleString()} asistentes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Summary */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Presupuestos</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Total:</span>
                <span className="text-xs font-semibold text-slate-800">{negocio.presupuestos.length}</span>
              </div>
              {presupuestosAprobados > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-600">Aprobados:</span>
                  <span className="text-xs font-medium text-green-600">{presupuestosAprobados}</span>
                </div>
              )}
              {presupuestosEnviados > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600">Enviados:</span>
                  <span className="text-xs font-medium text-blue-600">{presupuestosEnviados}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">HubSpot</span>
            </div>
            <BusinessSyncStatus negocio={negocio} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-end">
        <Button 
          onClick={onCrearPresupuesto}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-9"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>
    </div>
  );
};

export default BusinessDetailHeader;
