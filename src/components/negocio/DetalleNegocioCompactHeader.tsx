
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin, User, Building } from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';

interface DetalleNegocioCompactHeaderProps {
  negocio: Negocio;
  onVolver: () => void;
  onCambiarEstado?: (negocioId: string, nuevoEstado: string) => void;
}

const DetalleNegocioCompactHeader: React.FC<DetalleNegocioCompactHeaderProps> = ({ 
  negocio, 
  onVolver,
  onCambiarEstado 
}) => {
  const valorTotal = calcularValorNegocio(negocio);

  const handleStateChange = (negocioId: string, nuevoEstado: string) => {
    if (onCambiarEstado) {
      onCambiarEstado(negocioId, nuevoEstado);
    }
  };

  // Determine which company to display (productora takes priority, then cliente final)
  const empresaDisplay = negocio.productora?.nombre || negocio.clienteFinal?.nombre || 'N/A';

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVolver}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Negocio #{negocio.numero}
              </h1>
              <p className="text-slate-600">{negocio.evento.nombreEvento}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatearPrecio(valorTotal)}
              </div>
              <div className="text-sm text-slate-500">Valor Total</div>
            </div>
            <BusinessStateSelect
              negocio={negocio}
              onStateChange={handleStateChange}
              size="default"
            />
          </div>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{negocio.contacto.nombre}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{empresaDisplay}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">
              {negocio.evento.fechaEvento ? new Date(negocio.evento.fechaEvento).toLocaleDateString() : 'No definida'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{negocio.evento.locacion}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetalleNegocioCompactHeader;
