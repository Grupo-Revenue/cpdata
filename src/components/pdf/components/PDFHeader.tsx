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
    <div className="border-b-2 border-primary pb-6 mb-8 bg-gradient-to-r from-secondary to-background rounded-xl p-8 shadow-soft">
      <div className="flex justify-between items-start gap-8">
        {/* Left Section - Company Info */}
        <div className="flex items-start gap-4 flex-1">
          {brandConfig?.logo_url && (
            <div className="flex-shrink-0">
              <img 
                src={brandConfig.logo_url} 
                alt={`${brandConfig.nombre_empresa} Logo`} 
                className="h-12 w-auto object-contain border border-border rounded-lg p-2 bg-card shadow-sm" 
              />
            </div>
          )}
          <div className="space-y-3 flex-1">
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                {brandConfig?.nombre_empresa || 'CP Data SpA'}
              </h1>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                Soluciones Profesionales en Acreditación Digital
              </p>
            </div>
            <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="font-semibold">Fecha de Emisión:</span>
                <span>{fechaActual}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Válido hasta:</span>
                <span>{formatearFechaVencimiento()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Moneda:</span>
                <span>Pesos Chilenos (CLP)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Quote Info */}
        <div className="text-right bg-card p-6 rounded-xl shadow-soft border border-border min-w-[280px]">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-primary tracking-tight">PRESUPUESTO</h2>
            <div className="border-t border-border pt-3">
              <p className="text-lg font-semibold text-foreground mb-2 leading-tight">{presupuesto.nombre}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Negocio:</span>
                  <span className="font-semibold text-foreground">#{negocio.numero}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Estado:</span>
                  <span className="font-semibold text-foreground capitalize">{presupuesto.estado}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground font-medium">Total:</span>
                  <span className="text-lg font-bold text-primary">{formatearPrecio(totales.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFHeader;