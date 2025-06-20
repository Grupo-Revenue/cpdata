
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
    <CardHeader className="pb-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <CardTitle className="text-2xl text-slate-900">Presupuestos</CardTitle>
            <Button 
              onClick={onCrearPresupuesto} 
              className="bg-slate-900 text-white hover:bg-slate-800 font-medium"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
          
          {/* Business value integrated */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                  <DollarSign className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Valor Total del Negocio</p>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl font-bold text-slate-900">
                      {formatearPrecio(valorNegocio)}
                    </span>
                    {valorNegocio > 0 && (
                      <div className="flex items-center space-x-1 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Activo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Status indicators */}
              {infoPresupuestos.totalPresupuestos > 0 && (
                <div className="flex flex-wrap gap-2">
                  {infoPresupuestos.presupuestosAprobados > 0 && (
                    <div className="flex items-center space-x-2 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full text-sm">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-emerald-700 font-medium">
                        {infoPresupuestos.presupuestosAprobados} aprobado{infoPresupuestos.presupuestosAprobados !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {infoPresupuestos.presupuestosEnviados > 0 && (
                    <div className="flex items-center space-x-2 bg-blue-100 border border-blue-200 px-3 py-1 rounded-full text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-700 font-medium">
                        {infoPresupuestos.presupuestosEnviados} enviado{infoPresupuestos.presupuestosEnviados !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {infoPresupuestos.presupuestosBorrador > 0 && (
                    <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-sm">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      <span className="text-slate-700 font-medium">
                        {infoPresupuestos.presupuestosBorrador} borrador{infoPresupuestos.presupuestosBorrador !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {infoPresupuestos.totalPresupuestos > 0 ? (
              <p className="text-slate-600 text-sm mt-3">
                Basado en {infoPresupuestos.totalPresupuestos} presupuesto{infoPresupuestos.totalPresupuestos !== 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-slate-500 text-sm mt-3">Sin presupuestos creados</p>
            )}
          </div>
        </div>
      </div>
    </CardHeader>
  );
};

export default PresupuestosCardHeader;
