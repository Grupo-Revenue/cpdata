import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearPrecio } from '@/utils/formatters';
import { useBrandConfig } from '@/hooks/useBrandConfig';
import { Presupuesto, Negocio } from '@/types';
import { QuoteTotals } from '@/utils/quoteCalculations';

interface PDFHeaderProps {
  presupuesto: Presupuesto;
  negocio: Negocio;
  totales: QuoteTotals;
}

const PDFHeader: React.FC<PDFHeaderProps> = ({ presupuesto, negocio, totales }) => {
  const { config: brandConfig } = useBrandConfig();
  
  const fechaActual = format(new Date(), 'dd/MM/yyyy', { locale: es });
  
  const formatearFechaVencimiento = () => {
    const fechaEmision = new Date();
    const fechaVencimiento = new Date(fechaEmision);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    return format(fechaVencimiento, 'dd/MM/yyyy', { locale: es });
  };

  return (
    <div className="border-b-3 border-blue-600 pb-8 mb-8 bg-gradient-to-r from-blue-50 to-white rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-6">
          {brandConfig?.logo_url && (
            <div className="flex-shrink-0">
              <img 
                src={brandConfig.logo_url} 
                alt={`${brandConfig.nombre_empresa} Logo`} 
                className="h-20 w-auto object-contain border border-gray-200 rounded-lg p-2 bg-white shadow-sm" 
              />
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-800">
              {brandConfig?.nombre_empresa || 'CP Data SpA'}
            </h1>
            <p className="text-sm text-gray-600 font-medium">Soluciones Profesionales en Acreditación Digital</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p><span className="font-semibold">Fecha de Emisión:</span> {fechaActual}</p>
              <p><span className="font-semibold">Válido hasta:</span> {formatearFechaVencimiento()}</p>
              <p><span className="font-semibold">Moneda:</span> Pesos Chilenos (CLP)</p>
            </div>
          </div>
        </div>
        <div className="text-right bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-3xl font-bold text-blue-600 mb-2">PRESUPUESTO</h2>
          <p className="text-xl font-semibold text-gray-800 mb-3">{presupuesto.nombre}</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-semibold">Negocio:</span> #{negocio.numero}</p>
            <p><span className="font-semibold">Estado:</span> {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}</p>
            <p><span className="font-semibold">Total:</span> <span className="text-blue-600 font-bold">{formatearPrecio(totales.total)}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFHeader;