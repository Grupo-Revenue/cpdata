
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus, TrendingUp } from 'lucide-react';
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
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50 border-0 shadow-lg">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-green-100/30 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/20 to-blue-100/20 rounded-full translate-y-12 -translate-x-12"></div>
      
      <CardContent className="relative p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Valor del Negocio</h2>
                <p className="text-sm text-gray-600">Total estimado del proyecto</p>
              </div>
            </div>

            {/* Main value */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {formatearPrecio(valorNegocio)}
                </span>
                {valorNegocio > 0 && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Activo</span>
                  </div>
                )}
              </div>
              
              {infoPresupuestos.totalPresupuestos > 0 ? (
                <p className="text-gray-600 mt-2">
                  Basado en {infoPresupuestos.totalPresupuestos} presupuesto{infoPresupuestos.totalPresupuestos !== 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-gray-500 mt-2">Sin presupuestos creados</p>
              )}
            </div>

            {/* Status indicators */}
            {infoPresupuestos.totalPresupuestos > 0 && (
              <div className="flex flex-wrap gap-3">
                {infoPresupuestos.presupuestosAprobados > 0 && (
                  <div className="flex items-center space-x-2 bg-green-100 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">
                      {infoPresupuestos.presupuestosAprobados} aprobado{infoPresupuestos.presupuestosAprobados !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {infoPresupuestos.presupuestosEnviados > 0 && (
                  <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700">
                      {infoPresupuestos.presupuestosEnviados} enviado{infoPresupuestos.presupuestosEnviados !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {infoPresupuestos.presupuestosBorrador > 0 && (
                  <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {infoPresupuestos.presupuestosBorrador} borrador{infoPresupuestos.presupuestosBorrador !== 1 ? 'es' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="ml-6">
            <Button 
              onClick={onCrearPresupuesto} 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              {valorNegocio === 0 ? 'Crear Primer Presupuesto' : 'Nuevo Presupuesto'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValorNegocioCard;
