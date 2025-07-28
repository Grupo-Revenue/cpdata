import React from 'react';
import { formatearPrecio, stripHtml } from '@/utils/formatters';
import { Presupuesto } from '@/types';

interface PDFProductTableProps {
  presupuesto: Presupuesto;
}

const PDFProductTable: React.FC<PDFProductTableProps> = ({ presupuesto }) => {
  // Function to clean HTML and prevent unwanted "0" values
  const cleanHtmlContent = (html: string) => {
    if (!html || html.trim() === '' || html.trim() === '0') return '';
    
    // Create temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all text nodes that are just "0"
    const walker = document.createTreeWalker(
      temp,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.trim() === '0') {
        textNodes.push(node);
      }
    }
    
    textNodes.forEach(node => node.remove());
    
    // Clean up empty elements
    const cleanedHtml = temp.innerHTML
      .replace(/<[^>]*>\s*<\/[^>]*>/g, '') // Remove empty tags
      .replace(/^\s*0\s*$/g, '') // Remove standalone zeros
      .trim();
    
    return cleanedHtml === '0' || cleanedHtml === '' ? '' : cleanedHtml;
  };

  const renderSessionDetails = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) {
      return null;
    }
    
    // Filter sessions that have valid personnel data
    const validSessions = sessions.filter(session => {
      const acreditadores = session.acreditadores || 0;
      const supervisor = session.supervisor || 0;
      const totalPersonal = acreditadores + supervisor;
      
      // Only show sessions with personnel > 0 and valid pricing
      return totalPersonal > 0 && session.precio > 0;
    });

    if (validSessions.length === 0) {
      return null;
    }
    
    return (
      <div className="ml-4 mt-2">
        {validSessions.map((session, index) => {
          const acreditadores = session.acreditadores || 0;
          const supervisor = session.supervisor || 0;
          const totalPersonal = acreditadores + supervisor;
          const subtotal = session.precio * totalPersonal;
          
          return (
            <div key={session.id || index} className="flex justify-between items-center py-1 text-sm border-b border-gray-200 last:border-b-0">
              <div className="flex-1">
                <span className="text-gray-700">{session.fecha} - {session.servicio}</span>
              </div>
              <div className="flex-1 text-center">
                <span className="text-gray-600">{acreditadores} acred. + {supervisor} super.</span>
              </div>
              <div className="flex-1 text-right">
                <span className="text-gray-700 font-medium">{formatearPrecio(session.precio)}</span>
              </div>
              <div className="w-24 text-right">
                <span className="text-gray-700 font-medium">{formatearPrecio(subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <table className="w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 p-3 text-left font-bold text-gray-800">DESCRIPCIÓN</th>
            <th className="border border-gray-400 p-3 text-center font-bold text-gray-800 w-20">CANT.</th>
            <th className="border border-gray-400 p-3 text-right font-bold text-gray-800 w-32">PRECIO UNIT.</th>
            <th className="border border-gray-400 p-3 text-right font-bold text-gray-800 w-32">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {(presupuesto.productos || []).map((producto, index) => (
            <React.Fragment key={`producto-${producto.id || index}`}>
              <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-400 p-3">
                  <div className="font-semibold text-gray-800 text-lg">{producto.nombre}</div>
                  {producto.descripcion && cleanHtmlContent(producto.descripcion) && (
                    <div className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: cleanHtmlContent(producto.descripcion) }} />
                  )}
                  {producto.comentarios && cleanHtmlContent(producto.comentarios) && (
                    <div className="text-sm text-gray-600 mt-2 italic" dangerouslySetInnerHTML={{ __html: cleanHtmlContent(producto.comentarios) }} />
                  )}
                  {producto.descuentoPorcentaje !== undefined && (
                    producto.descuentoPorcentaje > 0 ? (
                      <div className="text-sm text-red-600 font-medium mt-1">
                        Descuento aplicado: {producto.descuentoPorcentaje}%
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mt-1">
                        Sin descuento
                      </div>
                    )
                  )}
                </td>
                <td className="border border-gray-400 p-3 text-center font-medium">{producto.cantidad}</td>
                <td className="border border-gray-400 p-3 text-right font-medium">
                  {formatearPrecio(producto.precioUnitario || producto.precio_unitario)}
                </td>
                <td className="border border-gray-400 p-3 text-right font-bold">{formatearPrecio(producto.total)}</td>
              </tr>
              
              {/* Session Details as Sub-rows */}
              {producto.sessions && producto.sessions.length > 0 && (
                <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td colSpan={4} className="border border-gray-400 p-0">
                    <div className="bg-gray-100 border-t border-gray-300">
                      <div className="px-3 py-2">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Detalle de Sesiones de Acreditación:</div>
                        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 pb-1 border-b border-gray-300">
                          <div className="col-span-4">Fecha y Servicio</div>
                          <div className="col-span-3 text-center">Personal</div>
                          <div className="col-span-2 text-right">Precio por Persona</div>
                          <div className="col-span-3 text-right">Subtotal</div>
                        </div>
                        {renderSessionDetails(producto.sessions)}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PDFProductTable;