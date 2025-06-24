
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';
import { Calendar, DollarSign } from 'lucide-react';

interface BusinessSummaryHeaderProps {
  negocio: Negocio;
  onCambiarEstado?: (negocioId: string, nuevoEstado: string) => void;
}

const BusinessSummaryHeader: React.FC<BusinessSummaryHeaderProps> = ({
  negocio,
  onCambiarEstado
}) => {
  const valorTotal = calcularValorNegocio(negocio);
  const empresaDisplay = negocio.productora?.nombre || negocio.clienteFinal?.nombre || 'Sin empresa';
  
  const handleStateChange = (negocioId: string, nuevoEstado: string) => {
    if (onCambiarEstado) {
      onCambiarEstado(negocioId, nuevoEstado);
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Left Section: Title and Business State */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold text-slate-900">
                {empresaDisplay} - Negocio #{negocio.numero}
              </h1>
              
              <BusinessStateSelect
                negocio={negocio}
                onStateChange={handleStateChange}
              />
            </div>
          </div>

          {/* Right Section: Key Information */}
          <div className="flex flex-col sm:flex-row gap-6 min-w-fit">
            
            {/* Close Date */}
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Fecha Cierre</span>
              </div>
              <span className="text-sm text-slate-600">
                {negocio.fechaCierre 
                  ? new Date(negocio.fechaCierre).toLocaleDateString('es-CL')
                  : 'Pendiente'
                }
              </span>
            </div>

            {/* Event Date */}
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Fecha Evento</span>
              </div>
              <span className="text-sm text-slate-600">
                {negocio.evento.fechaEvento 
                  ? new Date(negocio.evento.fechaEvento).toLocaleDateString('es-CL')
                  : 'Pendiente'
                }
              </span>
            </div>

            {/* Business Amount */}
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Valor Total</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {formatearPrecio(valorTotal)}
              </span>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessSummaryHeader;
