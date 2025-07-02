
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

export const usePDFGeneration = () => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Presupuesto',
    pageStyle: `
      @page {
        size: A4;
        margin: 0.5in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  return {
    componentRef,
    generatePDF: handlePrint,
  };
};
