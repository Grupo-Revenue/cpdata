
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
        table {
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        td {
          page-break-inside: avoid;
        }
        .product-description {
          page-break-inside: avoid;
        }
      }
    `,
  });

  return {
    componentRef,
    generatePDF: handlePrint,
  };
};
