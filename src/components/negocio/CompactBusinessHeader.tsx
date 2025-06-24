
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin, User, Building, Clock, Users } from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';

interface CompactBusinessHeaderProps {
  negocio: Negocio;
  onVolver: () => void;
  onCambiarEstado?: (negocioId: string, nuevoEstado: string) => void;
}

const CompactBusinessHeader: React.FC<CompactBusinessHeaderProps> = ({ 
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

  const empresaDisplay = negocio.productora?.nombre || negocio.clienteFinal?.nombre || 'Sin empresa';

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-4">
        {/* Top Row - Navigation and Title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVolver}
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Negocio #{negocio.numero}
              </h1>
              <p className="text-sm text-slate-600">{negocio.evento.nombreEvento}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {formatearPrecio(valorTotal)}
              </div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <BusinessStateSelect
              negocio={negocio}
              onStateChange={handleStateChange}
              size="sm"
            />
          </div>
        </div>

        {/* Bottom Row - Key Info */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="text-slate-700 truncate">{negocio.contacto.nombre}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="text-slate-700 truncate">{empresaDisplay}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="text-slate-700">
              {negocio.evento.fechaEvento ? new Date(negocio.evento.fechaEvento).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }) : 'Pendiente'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="text-slate-700 truncate">{negocio.evento.locacion}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="text-slate-700">{negocio.evento.cantidadAsistentes.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactBusinessHeader;
