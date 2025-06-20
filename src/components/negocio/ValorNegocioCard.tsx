
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus } from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio, obtenerInfoPresupuestos } from '@/utils/businessCalculations';

interface ValorNegocioCardProps {
  negocio: Negocio;
  onCrearPresupuesto: () => void;
}

const ValorNegocioCard: React.FC<ValorNegocioCardProps> = ({ negocio, onCrearPresupuesto }) => {
  const valorNegocio = calcularValorNegocio(negocio);
  const infoPresupuestos = obtenerInfoPresupuestos(negocio);

  return (
    <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center text-green-700">
          <DollarSign className="w-6 h-6 mr-2" />
          Valor del Negocio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold text-green-600 mb-2">
              {formatearPrecio(valorNegocio)}
            </p>
            <p className="text-sm text-gray-600">
              Basado en {infoPresupuestos.totalPresupuestos} presupuesto{infoPresupuestos.totalPresupuestos !== 1 ? 's' : ''}
            </p>
            {infoPresupuestos.totalPresupuestos > 0 && (
              <div className="flex space-x-4 mt-2 text-xs">
                {infoPresupuestos.presupuestosAprobados > 0 && (
                  <span className="text-green-600">
                    {infoPresupuestos.presupuestosAprobados} aprobado{infoPresupuestos.presupuestosAprobados !== 1 ? 's' : ''}
                  </span>
                )}
                {infoPresupuestos.presupuestosEnviados > 0 && (
                  <span className="text-blue-600">
                    {infoPresupuestos.presupuestosEnviados} enviado{infoPresupuestos.presupuestosEnviados !== 1 ? 's' : ''}
                  </span>
                )}
                {infoPresupuestos.presupuestosBorrador > 0 && (
                  <span className="text-gray-600">
                    {infoPresupuestos.presupuestosBorrador} borrador{infoPresupuestos.presupuestosBorrador !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
          {valorNegocio === 0 && (
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">Sin presupuestos</p>
              <Button 
                onClick={onCrearPresupuesto} 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Crear Presupuesto
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ValorNegocioCard;
