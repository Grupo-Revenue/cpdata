
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Target } from 'lucide-react';
import { Negocio } from '@/types';
import { useNegocio } from '@/context/NegocioContext';
import { obtenerEstadoNegocioInfo, formatBusinessStateForDisplay } from '@/utils/businessCalculations';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';

interface BusinessStatusCardProps {
  negocio: Negocio;
}

const BusinessStatusCard: React.FC<BusinessStatusCardProps> = ({ negocio }) => {
  const { cambiarEstadoNegocio } = useNegocio();
  const { colorEstado } = obtenerEstadoNegocioInfo(negocio);

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha no válida';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Estado del Negocio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Estado Actual</p>
          <BusinessStateSelect
            negocio={negocio}
            onStateChange={cambiarEstadoNegocio}
          />
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Creado:</span>
            <span className="font-medium">{formatearFecha(negocio.fechaCreacion)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Número:</span>
            <Badge variant="outline">#{negocio.numero}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessStatusCard;
