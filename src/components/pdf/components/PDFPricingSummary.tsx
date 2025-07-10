import React from 'react';
import { formatearPrecio } from '@/utils/formatters';
import { QuoteTotals, IVA_PERCENTAGE } from '@/utils/quoteCalculations';

interface PDFPricingSummaryProps {
  totales: QuoteTotals;
}

const PDFPricingSummary: React.FC<PDFPricingSummaryProps> = ({ totales }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-end">
        <div className="w-80">
          <table className="w-full border-collapse border border-gray-400">
            <tbody>
              {totales.totalDescuentos > 0 && (
                <tr>
                  <td className="border border-gray-400 p-3 text-right font-semibold bg-gray-100">Subtotal:</td>
                  <td className="border border-gray-400 p-3 text-right bg-gray-100">{formatearPrecio(totales.subtotal)}</td>
                </tr>
              )}
              {totales.totalDescuentos > 0 && (
                <tr>
                  <td className="border border-gray-400 p-3 text-right font-semibold bg-gray-100 text-red-600">Descuentos:</td>
                  <td className="border border-gray-400 p-3 text-right bg-gray-100 text-red-600">-{formatearPrecio(totales.totalDescuentos)}</td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-400 p-3 text-right font-semibold bg-gray-100">Subtotal Neto:</td>
                <td className="border border-gray-400 p-3 text-right bg-gray-100 font-semibold">{formatearPrecio(totales.subtotalConDescuento)}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-3 text-right font-semibold bg-gray-100">IVA ({IVA_PERCENTAGE}%):</td>
                <td className="border border-gray-400 p-3 text-right bg-gray-100 font-semibold">{formatearPrecio(totales.iva)}</td>
              </tr>
              <tr className="bg-gray-800 text-white">
                <td className="border border-gray-400 p-3 text-right font-bold text-lg">TOTAL GENERAL:</td>
                <td className="border border-gray-400 p-3 text-right font-bold text-xl">
                  {formatearPrecio(totales.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PDFPricingSummary;