import React from 'react';
import { formatearPrecio } from '@/utils/formatters';
import { QuoteTotals, IVA_PERCENTAGE } from '@/utils/quoteCalculations';

interface PDFPricingSummaryProps {
  totales: QuoteTotals;
}

const PDFPricingSummary: React.FC<PDFPricingSummaryProps> = ({ totales }) => {
  return (
    <div className="mb-8">
      <div className="w-full max-w-md ml-auto">
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 p-3 text-right font-semibold">Subtotal (Neto):</td>
              <td className="border border-gray-300 p-3 text-right">{formatearPrecio(totales.subtotalConDescuento)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 p-3 text-right font-semibold">IVA ({IVA_PERCENTAGE}%):</td>
              <td className="border border-gray-300 p-3 text-right">{formatearPrecio(totales.iva)}</td>
            </tr>
            <tr className="bg-blue-100">
              <td className="border border-gray-300 p-3 text-right font-bold text-lg">TOTAL:</td>
              <td className="border border-gray-300 p-3 text-right font-bold text-lg text-blue-600">
                {formatearPrecio(totales.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PDFPricingSummary;