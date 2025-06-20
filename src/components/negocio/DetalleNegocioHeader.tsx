
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Negocio } from '@/types';

interface DetalleNegocioHeaderProps {
  negocio: Negocio;
  onVolver: () => void;
}

const DetalleNegocioHeader: React.FC<DetalleNegocioHeaderProps> = ({ negocio, onVolver }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onVolver}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Negocio #{negocio.numero}</h1>
          <p className="text-gray-600">{negocio.evento.nombreEvento}</p>
        </div>
      </div>
      <Badge className={`px-3 py-1 ${negocio.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
        {negocio.estado.charAt(0).toUpperCase() + negocio.estado.slice(1)}
      </Badge>
    </div>
  );
};

export default DetalleNegocioHeader;
