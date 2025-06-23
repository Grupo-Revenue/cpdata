
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';
import { Negocio } from '@/types';
import { useNegocio } from '@/context/NegocioContext';
import { calcularValorNegocio, obtenerEstadoNegocioInfo } from '@/utils/businessCalculations';

interface BusinessStatusCardProps {
  negocio: Negocio;
}

const BusinessStatusCard: React.FC<BusinessStatusCardProps> = ({ negocio }) => {
  const { cambiarEstadoNegocio } = useNegocio();
  const valorTotal = calcularValorNegocio(negocio);

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const handleEstadoChange = async (negocioId: string, nuevoEstado: string) => {
    await cambiarEstadoNegocio(negocioId, nuevoEstado);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estado del Negocio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">
            Estado Actual
          </label>
          <BusinessStateSelect
            negocio={negocio}
            onStateChange={handleEstadoChange}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">
            Valor Total
          </label>
          <div className="text-2xl font-bold text-green-600">
            {formatearPrecio(valorTotal)}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">
            Presupuestos
          </label>
          <div className="text-lg font-semibold">
            {negocio.presupuestos.length} presupuesto{negocio.presupuestos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessStatusCard;
