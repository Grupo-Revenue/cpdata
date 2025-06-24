
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
  RefreshCw,
  Phone,
  Mail,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';
import { useHubSpotSync } from '@/hooks/useHubSpotSync';

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
  const { manualSyncNegocio, isSyncing } = useHubSpotSync();
  
  // Get company name for the title
  const empresaDisplay = negocio.productora?.nombre || negocio.clienteFinal?.nombre || 'Sin empresa';

  const handleStateChange = (negocioId: string, nuevoEstado: string) => {
    if (onCambiarEstado) {
      onCambiarEstado(negocioId, nuevoEstado);
    }
  };

  const handleHubSpotSync = () => {
    manualSyncNegocio(negocio.id);
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
          
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {empresaDisplay} - Negocio #{negocio.numero}
              </h1>
              <p className="text-lg text-slate-600 mt-1">{negocio.evento.nombreEvento}</p>
            </div>
            
            {/* Integrated Business Value */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-slate-50 rounded-lg border">
              <div className="p-2 bg-slate-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Valor Total</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-slate-900">
                    {formatearPrecio(valorTotal)}
                  </span>
                  {valorTotal > 0 && (
                    <div className="flex items-center space-x-1 text-emerald-600">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-medium">Activo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* State and Sync Controls */}
        <div className="flex items-center space-x-3">
          <BusinessStateSelect
            negocio={negocio}
            onStateChange={handleStateChange}
            size="default"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleHubSpotSync}
            disabled={isSyncing(negocio.id)}
            className="h-10 px-3"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing(negocio.id) ? 'animate-spin' : ''}`} />
            {isSyncing(negocio.id) ? 'Sincronizando...' : 'HubSpot Sync'}
          </Button>
        </div>
      </div>

      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact Info */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Contacto</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-800 font-medium">{negocio.contacto.nombre} {negocio.contacto.apellido}</p>
              <div className="flex items-center space-x-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600">{negocio.contacto.telefono}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600 truncate">{negocio.contacto.email}</span>
              </div>
              {negocio.contacto.cargo && (
                <p className="text-xs text-slate-500">{negocio.contacto.cargo}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Building className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Empresa</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-800 font-medium">{empresaDisplay}</p>
              {negocio.productora && negocio.clienteFinal && (
                <>
                  <div className="text-xs text-slate-600">
                    <span className="font-medium">Productora:</span> {negocio.productora.nombre}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-medium">Cliente Final:</span> {negocio.clienteFinal.nombre}
                  </div>
                </>
              )}
              {negocio.productora && !negocio.clienteFinal && (
                <div className="text-xs text-slate-500">Productora</div>
              )}
              {!negocio.productora && negocio.clienteFinal && (
                <div className="text-xs text-slate-500">Cliente Directo</div>
              )}
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
              <p className="text-sm text-slate-800 font-medium">{negocio.evento.tipoEvento}</p>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600">
                  {negocio.evento.fechaEvento ? new Date(negocio.evento.fechaEvento).toLocaleDateString('es-CL') : 'Por definir'}
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
      </div>
    </div>
  );
};

export default BusinessDetailHeader;
