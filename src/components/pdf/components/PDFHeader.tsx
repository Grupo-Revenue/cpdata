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
const PDFHeader: React.FC<PDFHeaderProps> = ({
  presupuesto,
  negocio,
  totales
}) => {
  const {
    config: brandConfig
  } = useBrandConfig();
  const fechaActual = format(new Date(), 'dd/MM/yyyy', {
    locale: es
  });
  const formatearFechaVencimiento = () => {
    const fechaEmision = new Date();
    const fechaVencimiento = new Date(fechaEmision);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    return format(fechaVencimiento, 'dd/MM/yyyy', {
      locale: es
    });
  };
  return <div className="mb-6">
      {/* Top Brand Section */}
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          {brandConfig?.logo_url && (
            <img 
              src={brandConfig.logo_url.startsWith('data:') ? brandConfig.logo_url : (brandConfig.logo_url.startsWith('/') ? `${window.location.origin}${brandConfig.logo_url}` : brandConfig.logo_url)} 
              alt={`${brandConfig.nombre_empresa} Logo`} 
              className="h-20 w-auto object-contain max-w-[200px]"
              onError={(e) => {
                console.error('Error loading logo:', brandConfig.logo_url);
                console.log('Full logo URL being used:', e.currentTarget.src);
              }}
              onLoad={() => {
                console.log('Logo loaded successfully:', brandConfig.logo_url);
              }}
            />
          )}
          
        </div>
        
        {/* Quote Header */}
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">COTIZACIÓN</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <div><span className="font-semibold">N°:</span> {presupuesto.nombre}</div>
            <div><span className="font-semibold">Fecha:</span> {fechaActual}</div>
            <div><span className="font-semibold">Validez:</span> {formatearFechaVencimiento()}</div>
          </div>
        </div>
      </div>

      {/* Quote Summary Box */}
      <div className="bg-gray-50 border border-gray-300 p-4 mb-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">DATOS DEL CLIENTE</h3>
            <div className="text-sm space-y-1">
              <div><span className="font-semibold">Contacto:</span> {negocio.contacto.nombre} {negocio.contacto.apellido}</div>
              <div><span className="font-semibold">Email:</span> {negocio.contacto.email}</div>
              <div><span className="font-semibold">Teléfono:</span> {negocio.contacto.telefono}</div>
              {negocio.productora && <div><span className="font-semibold">Empresa:</span> {negocio.productora.nombre}</div>}
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-800 mb-2">DATOS DEL EVENTO</h3>
            <div className="text-sm space-y-1">
              <div><span className="font-semibold">Evento:</span> {negocio.evento.nombreEvento}</div>
              <div><span className="font-semibold">Tipo:</span> {negocio.evento.tipoEvento}</div>
              <div><span className="font-semibold">Fecha:</span> {negocio.evento.fechaEvento ? format(new Date(negocio.evento.fechaEvento), 'dd/MM/yyyy', {
                locale: es
              }) : 'Por definir'}</div>
              <div><span className="font-semibold">Lugar:</span> {negocio.evento.locacion}</div>
              <div><span className="font-semibold">Asistentes:</span> {negocio.evento.cantidadAsistentes}</div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default PDFHeader;