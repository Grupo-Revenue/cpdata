
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { Negocio } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { obtenerEstadoNegocioInfo } from '@/utils/businessCalculations';
import HubSpotSyncButton from '@/components/hubspot/HubSpotSyncButton';

interface DetalleNegocioCompactHeaderProps {
  negocio: Negocio;
  onVolver: () => void;
}

const DetalleNegocioCompactHeader: React.FC<DetalleNegocioCompactHeaderProps> = ({ negocio, onVolver }) => {
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  const { descripcionEstado, colorEstado } = obtenerEstadoNegocioInfo(negocio);

  return (
    <Card className="shadow-soft">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={onVolver}
              size="sm"
              className="hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
            
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-2xl font-semibold text-gray-900">Negocio #{negocio.numero}</h1>
                  <Badge 
                    variant="outline"
                    className={`text-xs px-2 py-0.5 border ${colorEstado}`}
                    title={descripcionEstado}
                  >
                    {negocio.estado.charAt(0).toUpperCase() + negocio.estado.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-gray-600 font-medium">{negocio.evento.nombreEvento}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* HubSpot Sync Button */}
            <HubSpotSyncButton negocio={negocio} />

            {/* Key event info */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              {negocio.evento.fechaEvento && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatearFecha(negocio.evento.fechaEvento)}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-48">{negocio.evento.locacion}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetalleNegocioCompactHeader;
