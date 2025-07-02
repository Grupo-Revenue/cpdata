
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Negocio } from '@/types';
import { obtenerEstadoNegocioInfo, formatBusinessStateForDisplay } from '@/utils/businessCalculations';

interface DetalleNegocioHeaderProps {
  negocio: Negocio;
  onVolver: () => void;
}

const DetalleNegocioHeader: React.FC<DetalleNegocioHeaderProps> = ({ negocio, onVolver }) => {
  const { colorEstado } = obtenerEstadoNegocioInfo(negocio);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Button 
            variant="outline" 
            onClick={onVolver}
            className="border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">Negocio #{negocio.numero}</h1>
              <Badge 
                variant="outline"
                className={`px-3 py-1 ${colorEstado}`}
              >
                {formatBusinessStateForDisplay(negocio.estado)}
              </Badge>
            </div>
            <p className="text-xl text-slate-600 font-medium">{negocio.evento.nombreEvento}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleNegocioHeader;
