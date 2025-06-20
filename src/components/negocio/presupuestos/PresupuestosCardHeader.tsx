
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, TrendingUp } from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio, obtenerInfoPresupuestos } from '@/utils/businessCalculations';

interface PresupuestosCardHeaderProps {
  negocio: Negocio;
  onCrearPresupuesto: () => void;
}

const PresupuestosCardHeader: React.FC<PresupuestosCardHeaderProps> = ({
  negocio,
  onCrearPresupuesto
}) => {
  const valorNegocio = calcularValorNegocio(negocio);
  const infoPresupuestos = obtenerInfoPresupuestos(negocio);

  return (
    <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl">Presupuestos del Negocio</CardTitle>
            <Button 
              onClick={onCrearPresupuesto} 
              variant="secondary"
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
          
          {/* Valor del negocio integrado */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80 font-medium">Valor Total del Negocio</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-white">
                      {formatearPrecio(valorNegocio)}
                    </span>
                    {valorNegocio > 0 && (
                      <div className="flex items-center space-x-1 text-green-200">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs font-medium">Activo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Status indicators */}
              {infoPresupuestos.totalPresupuestos > 0 && (
                <div className="flex flex-wrap gap-2">
                  {infoPresupuestos.presupuestosAprobados > 0 && (
                    <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded text-xs">
                      <div className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                      <span className="text-green-100 font-medium">
                        {infoPresupuestos.presupuestosAprobados} aprobado{infoPresupuestos.presupuestosAprobados !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {infoPresupuestos.presupuestosEnviados > 0 && (
                    <div className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded text-xs">
                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                      <span className="text-blue-100 font-medium">
                        {infoPresupuestos.presupuestosEnviados} enviado{infoPresupuestos.presupuestosEnviados !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {infoPresupuestos.presupuestosBorrador > 0 && (
                    <div className="flex items-center space-x-1 bg-gray-500/20 px-2 py-1 rounded text-xs">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                      <span className="text-gray-100 font-medium">
                        {infoPresupuestos.presupuestosBorrador} borrador{infoPresupuestos.presupuestosBorrador !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {infoPresupuestos.totalPresupuestos > 0 ? (
              <p className="text-white/70 text-sm mt-2">
                Basado en {infoPresupuestos.totalPresupuestos} presupuesto{infoPresupuestos.totalPresupuestos !== 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-white/60 text-sm mt-2">Sin presupuestos creados</p>
            )}
          </div>
        </div>
      </div>
    </CardHeader>
  );
};

export default PresupuestosCardHeader;
