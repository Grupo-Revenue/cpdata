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
const PresupuestoPDFTemplate = React.forwardRef<HTMLDivElement, PresupuestoPDFTemplateProps>(({
  presupuesto,
  negocio
}, ref) => {
  const {
    config: brandConfig
  } = useBrandConfig();
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', {
        locale: es
      });
    } catch {
      return fecha;
    }
  };
  const fechaActual = format(new Date(), 'dd/MM/yyyy', {
    locale: es
  });
  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };
  
  const renderHtmlContent = (html: string) => {
    if (!html) return null;
    return <div className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{
      __html: html
    }} />;
  };

  const formatearFechaVencimiento = () => {
    const fechaEmision = new Date();
    const fechaVencimiento = new Date(fechaEmision);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    return format(fechaVencimiento, 'dd/MM/yyyy', { locale: es });
  };

  const renderSessionDetails = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return null;
    
    return (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">Detalle de Sesiones:</div>
        <div className="space-y-1">
          {sessions.map((session, index) => (
            <div key={session.id || index} className="text-xs text-gray-600 flex justify-between">
              <span>{session.fecha} - {session.servicio}</span>
              <span>{session.acreditadores} acred. + {session.supervisor} super.</span>
              <span className="font-medium">{formatearPrecio(session.monto)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Calculate totals with IVA breakdown
  const totales = calcularTotalesPresupuesto(presupuesto.productos || []);
  return <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-black" style={{
    fontFamily: 'Arial, sans-serif'
  }}>
        {/* Enhanced Header with logo and company info */}
        <div className="border-b-3 border-blue-600 pb-8 mb-8 bg-gradient-to-r from-blue-50 to-white rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-6">
              {brandConfig?.logo_url && (
                <div className="flex-shrink-0">
                  <img 
                    src={brandConfig.logo_url} 
                    alt={`${brandConfig.nombre_empresa} Logo`} 
                    className="h-20 w-auto object-contain border border-gray-200 rounded-lg p-2 bg-white shadow-sm" 
                  />
                </div>
              )}
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-gray-800">
                  {brandConfig?.nombre_empresa || 'CP Data SpA'}
                </h1>
                <p className="text-sm text-gray-600 font-medium">Soluciones Profesionales en Acreditación Digital</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-semibold">Fecha de Emisión:</span> {fechaActual}</p>
                  <p><span className="font-semibold">Válido hasta:</span> {formatearFechaVencimiento()}</p>
                  <p><span className="font-semibold">Moneda:</span> Pesos Chilenos (CLP)</p>
                </div>
              </div>
            </div>
            <div className="text-right bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-3xl font-bold text-blue-600 mb-2">PRESUPUESTO</h2>
              <p className="text-xl font-semibold text-gray-800 mb-3">{presupuesto.nombre}</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-semibold">Negocio:</span> #{negocio.numero}</p>
                <p><span className="font-semibold">Estado:</span> {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}</p>
                <p><span className="font-semibold">Total:</span> <span className="text-blue-600 font-bold">{formatearPrecio(totales.total)}</span></p>
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
              {negocio.productora && <div>
                  <span className="font-semibold">Productora: </span>
                  {negocio.productora.nombre}
                </div>}
              {negocio.clienteFinal && <div>
                  <span className="font-semibold">Cliente Final: </span>
                  {negocio.clienteFinal.nombre}
                </div>}
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
                  <td className="border border-gray-300 p-3 text-right font-medium">{formatearPrecio(producto.precioUnitario || producto.precio_unitario)}</td>
                  <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">{formatearPrecio(producto.total)}</td>
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
                <p className="font-semibold">{brandConfig?.nombre_empresa || 'CP Data'} - Soluciones en Acreditación Digital</p>
                {brandConfig?.direccion && <p>Dirección: {brandConfig.direccion}</p>}
                <p>Email: {brandConfig?.email || 'contacto@cpdata.cl'}</p>
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
      </div>;
});
PresupuestoPDFTemplate.displayName = 'PresupuestoPDFTemplate';
export default PresupuestoPDFTemplate;