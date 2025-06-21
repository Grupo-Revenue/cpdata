import React from 'react';
import { Presupuesto, Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularTotalesPresupuesto, IVA_PERCENTAGE } from '@/utils/quoteCalculations';
import { useBrandConfig } from '@/hooks/useBrandConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PresupuestoPDFTemplateProps {
  presupuesto: Presupuesto;
  negocio: Negocio;
}

const PresupuestoPDFTemplate = React.forwardRef<HTMLDivElement, PresupuestoPDFTemplateProps>(
  ({ presupuesto, negocio }, ref) => {
    const { config: brandConfig } = useBrandConfig();
    
    const formatearFecha = (fecha: string) => {
      try {
        return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
      } catch {
        return fecha;
      }
    };

    const fechaActual = format(new Date(), 'dd/MM/yyyy', { locale: es });

    const stripHtmlTags = (html: string) => {
      if (!html) return '';
      return html.replace(/<[^>]*>/g, '');
    };

    const renderHtmlContent = (html: string) => {
      if (!html) return null;
      return (
        <div 
          className="text-sm text-gray-600 mt-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    };

    // Calculate totals with IVA breakdown
    const totales = calcularTotalesPresupuesto(presupuesto.productos);

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header without logo and company info */}
        <div className="border-b-2 border-blue-600 pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="mt-2 text-sm text-gray-500">
                <p>Fecha de Emisión: {fechaActual}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">PRESUPUESTO</h2>
              <p className="text-lg font-semibold text-blue-600">{presupuesto.nombre}</p>
              <div className="mt-2 text-sm text-gray-600">
                <p>Negocio: #{negocio.numero}</p>
                <p>Estado: {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Company and Event Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-1">
              INFORMACIÓN DEL CLIENTE
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Contacto: </span>
                {negocio.contacto.nombre} {negocio.contacto.apellido}
              </div>
              <div>
                <span className="font-semibold">Email: </span>
                {negocio.contacto.email}
              </div>
              <div>
                <span className="font-semibold">Teléfono: </span>
                {negocio.contacto.telefono}
              </div>
              {negocio.productora && (
                <div>
                  <span className="font-semibold">Productora: </span>
                  {negocio.productora.nombre}
                </div>
              )}
              {negocio.clienteFinal && (
                <div>
                  <span className="font-semibold">Cliente Final: </span>
                  {negocio.clienteFinal.nombre}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-1">
              INFORMACIÓN DEL EVENTO
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Evento: </span>
                {negocio.evento.nombreEvento}
              </div>
              <div>
                <span className="font-semibold">Tipo: </span>
                {negocio.evento.tipoEvento}
              </div>
              <div>
                <span className="font-semibold">Fecha: </span>
                {negocio.evento.fechaEvento ? formatearFecha(negocio.evento.fechaEvento) : 'Por definir'}
              </div>
              <div>
                <span className="font-semibold">Locación: </span>
                {negocio.evento.locacion}
              </div>
              <div>
                <span className="font-semibold">Asistentes: </span>
                {negocio.evento.cantidadAsistentes}
              </div>
              <div>
                <span className="font-semibold">Invitados: </span>
                {negocio.evento.cantidadInvitados}
              </div>
              <div>
                <span className="font-semibold">Horas Acreditación: </span>
                {negocio.evento.horasAcreditacion}
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
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
              {presupuesto.productos.map((producto, index) => (
                <tr key={producto.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 p-3">
                    <div className="font-medium">{producto.nombre}</div>
                    {producto.descripcion && renderHtmlContent(producto.descripcion)}
                    {producto.comentarios && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Comentarios:</div>
                        {renderHtmlContent(producto.comentarios)}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">{producto.cantidad}</td>
                  <td className="border border-gray-300 p-3 text-right">{formatearPrecio(producto.precioUnitario)}</td>
                  <td className="border border-gray-300 p-3 text-right font-medium">{formatearPrecio(producto.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pricing Summary with IVA breakdown */}
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

        {/* Enhanced Corporate Footer */}
        <div className="border-t-2 border-blue-600 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h4 className="font-bold text-gray-800 mb-3">INFORMACIÓN DE CONTACTO</h4>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{brandConfig?.nombre_empresa || 'Empresa'}</p>
                {brandConfig?.direccion && <p>Dirección: {brandConfig.direccion}</p>}
                <p>Email: {brandConfig?.email || 'contacto@empresa.cl'}</p>
                <p>Teléfono: {brandConfig?.telefono || '+56 9 1234 5678'}</p>
                {brandConfig?.sitio_web && <p>Web: {brandConfig.sitio_web}</p>}
              </div>
            </div>
            <div className="text-right">
              <h4 className="font-bold text-gray-800 mb-3">CONDICIONES COMERCIALES</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Validez:</span> 30 días</p>
                <p><span className="font-semibold">Forma de Pago:</span> 30% anticipo, 70% contra entrega</p>
                <p><span className="font-semibold">Tiempo de Entrega:</span> 7-10 días hábiles</p>
                <p><span className="font-semibold">Moneda:</span> Pesos Chilenos (CLP)</p>
              </div>
            </div>
          </div>
          
          {/* Legal Footer */}
          <div className="border-t border-gray-200 pt-4">
            <div className="text-xs text-gray-500 leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-2">TÉRMINOS Y CONDICIONES:</p>
                  <ul className="space-y-1">
                    <li>• Los precios incluyen IVA y están expresados en pesos chilenos.</li>
                    <li>• Este presupuesto tiene validez de 30 días desde la fecha de emisión.</li>
                    <li>• Los servicios se ejecutarán según las especificaciones técnicas acordadas.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">CONDICIONES DE SERVICIO:</p>
                  <ul className="space-y-1">
                    <li>• Garantía de 12 meses en equipos y 90 días en servicios.</li>
                    <li>• Soporte técnico 24/7 durante el evento.</li>
                    <li>• Capacitación incluida para el uso de los sistemas.</li>
                  </ul>
                </div>
              </div>
              <div className="text-center mt-4 pt-3 border-t border-gray-200">
                <p className="font-semibold">
                  CP Data SpA - RUT: 76.XXX.XXX-X - Giro: Servicios de Tecnología
                </p>
                <p>
                  Certificada en normas ISO 9001:2015 | Empresa registrada en ChileCompra
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PresupuestoPDFTemplate.displayName = 'PresupuestoPDFTemplate';

export default PresupuestoPDFTemplate;
