import React from 'react';
import { Presupuesto, Negocio } from '@/types';
import { calcularTotalesPresupuesto } from '@/utils/quoteCalculations';
import PDFHeader from './components/PDFHeader';
import PDFProductTable from './components/PDFProductTable';
import PDFPricingSummary from './components/PDFPricingSummary';
import PDFConditionsSection from './components/PDFConditionsSection';
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
    <div ref={ref} className="bg-white p-12 w-full min-w-[1200px] mx-auto text-black" style={{
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      lineHeight: '1.8'
    }}>
      <PDFHeader presupuesto={presupuesto} negocio={negocio} totales={totales} />
      
      <PDFProductTable presupuesto={presupuesto} />
      
      <PDFPricingSummary totales={totales} />
      
      <PDFConditionsSection />
      
      <PDFFooter />
    </div>
  );
});

PresupuestoPDFTemplate.displayName = 'PresupuestoPDFTemplate';

export default PresupuestoPDFTemplate;