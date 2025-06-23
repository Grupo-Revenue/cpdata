
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin, AlertTriangle } from 'lucide-react';
import { Negocio } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { obtenerEstadoNegocioInfo, formatBusinessStateForDisplay, calcularValorNegocio } from '@/utils/businessCalculations';
import HubSpotSyncButton from '@/components/hubspot/HubSpotSyncButton';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';
import { useNegocio } from '@/context/NegocioContext';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';

interface DetalleNegocioCompactHeaderProps {
  negocio: Negocio;
  onVolver: () => void;
}

const DetalleNegocioCompactHeader: React.FC<DetalleNegocioCompactHeaderProps> = ({ negocio, onVolver }) => {
  const { cambiarEstadoNegocio } = useNegocio();
  const { syncConflicts } = useBidirectionalSync();

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const valorTotal = calcularValorNegocio(negocio);

  const handleEstadoChange = async (negocioId: string, nuevoEstado: string) => {
    await cambiarEstadoNegocio(negocioId, nuevoEstado);
  };

  // Check if this business has sync conflicts
  const hasConflict = syncConflicts.some(conflict => conflict.negocio_id === negocio.id);

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={onVolver}
              size="sm"
              className="text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
            
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Negocio #{negocio.numero}
                </h1>
                <p className="text-sm text-slate-600">{negocio.evento.nombreEvento}</p>
              </div>
              
              {/* Conflict indicator */}
              {hasConflict && (
                <div className="flex items-center space-x-1 bg-amber-100 px-2 py-1 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">Sync Conflict</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Business State */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Estado:</span>
              <BusinessStateSelect
                negocio={negocio}
                onStateChange={handleEstadoChange}
                size="sm"
              />
            </div>

            {/* Total Value */}
            <div className="text-right">
              <p className="text-xs text-slate-600">Valor Total</p>
              <p className="text-lg font-semibold text-green-600">
                {formatearPrecio(valorTotal)}
              </p>
            </div>

            {/* Key event info */}
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              {negocio.evento.fechaEvento && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatearFecha(negocio.evento.fechaEvento)}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-32">{negocio.evento.locacion}</span>
              </div>
            </div>

            {/* HubSpot Sync Button */}
            <HubSpotSyncButton negocio={negocio} variant="outline" size="sm" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetalleNegocioCompactHeader;
