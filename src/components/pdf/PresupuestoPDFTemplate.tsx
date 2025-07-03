import React from 'react';
import { Presupuesto, Negocio } from '@/types';
import { calcularTotalesPresupuesto } from '@/utils/quoteCalculations';
import PDFHeader from './components/PDFHeader';
import PDFClientEventInfo from './components/PDFClientEventInfo';
import PDFProductTable from './components/PDFProductTable';
import PDFPricingSummary from './components/PDFPricingSummary';
import PDFFooter from './components/PDFFooter';

interface PresupuestoPDFTemplateProps {
  presupuesto: Presupuesto;
  negocio: Negocio;
}

const PresupuestoPDFTemplate = React.forwardRef<HTMLDivElement, PresupuestoPDFTemplateProps>(({
  presupuesto,
  negocio
}, ref) => {
  // Calculate totals with IVA breakdown
  const totales = calcularTotalesPresupuesto(presupuesto.productos || []);

  return (
    <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-black" style={{
      fontFamily: 'Arial, sans-serif'
    }}>
      <PDFHeader presupuesto={presupuesto} negocio={negocio} totales={totales} />
      
      <PDFClientEventInfo negocio={negocio} />
      
      <PDFProductTable presupuesto={presupuesto} />
      
      <PDFPricingSummary totales={totales} />
      
      <PDFFooter />
    </div>
  );
});

PresupuestoPDFTemplate.displayName = 'PresupuestoPDFTemplate';

export default PresupuestoPDFTemplate;