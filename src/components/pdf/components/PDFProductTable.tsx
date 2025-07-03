import React from 'react';
import { formatearPrecio } from '@/utils/formatters';
import { Presupuesto } from '@/types';

interface PDFProductTableProps {
  presupuesto: Presupuesto;
}

const PDFProductTable: React.FC<PDFProductTableProps> = ({ presupuesto }) => {
  const renderHtmlContent = (html: string) => {
    if (!html) return null;
    return <div className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{
      __html: html
    }} />;
  };

  const renderSessionDetails = (sessions: any[]) => {
    console.log('Rendering session details:', sessions);
    if (!sessions || sessions.length === 0) {
      console.log('No sessions found or empty array');
      return null;
    }
    
    return (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">Detalle de Sesiones:</div>
        <div className="space-y-1">
          {sessions.map((session, index) => (
            <div key={session.id || index} className="text-xs text-gray-600 grid grid-cols-2 gap-2">
              <span className="font-medium">{session.fecha} - {session.servicio}</span>
              <span>{session.acreditadores} acred. + {session.supervisor} super.</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSessionPrices = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) {
      return null;
    }
    
    return (
      <div className="space-y-1">
        {sessions.map((session, index) => (
          <div key={session.id || index} className="text-xs text-gray-600 text-right">
            {formatearPrecio(session.precio)} x {(session.acreditadores || 0) + (session.supervisor || 0)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-1">
        DETALLE DE PRODUCTOS Y SERVICIOS
      </h3>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-blue-50">
            <th className="border border-gray-300 p-3 text-left font-semibold">Descripción</th>
            <th className="border border-gray-300 p-3 text-center font-semibold w-20">Cant.</th>
            <th className="border border-gray-300 p-3 text-right font-semibold w-32">Precio Unit.</th>
            <th className="border border-gray-300 p-3 text-right font-semibold w-32">Total</th>
          </tr>
        </thead>
        <tbody>
          {(presupuesto.productos || []).map((producto, index) => (
            <tr key={producto.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="border border-gray-300 p-3">
                <div className="font-medium text-gray-800 mb-1">{producto.nombre}</div>
                {producto.descripcion && (
                  <div className="text-sm text-gray-600 mb-2">
                    {renderHtmlContent(producto.descripcion)}
                  </div>
                )}
                
                {/* Session Details */}
                {producto.sessions && producto.sessions.length > 0 && renderSessionDetails(producto.sessions)}
                
                {/* Comments */}
                {producto.comentarios && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Comentarios:</div>
                    <div className="text-xs text-gray-600">
                      {renderHtmlContent(producto.comentarios)}
                    </div>
                  </div>
                )}
                
                {/* Discount if applicable */}
                {producto.descuentoPorcentaje && producto.descuentoPorcentaje > 0 && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    Descuento aplicado: {producto.descuentoPorcentaje}%
                  </div>
                )}
              </td>
              <td className="border border-gray-300 p-3 text-center font-medium">{producto.cantidad}</td>
              <td className="border border-gray-300 p-3 text-right font-medium">
                {producto.sessions && producto.sessions.length > 0 ? (
                  <div>
                    <div className="font-medium text-gray-800 mb-1">Precios por sesión:</div>
                    {renderSessionPrices(producto.sessions)}
                  </div>
                ) : (
                  formatearPrecio(producto.precioUnitario || producto.precio_unitario)
                )}
              </td>
              <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">{formatearPrecio(producto.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PDFProductTable;