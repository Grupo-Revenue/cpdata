
import React from 'react';
import { Presupuesto, Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PresupuestoPDFTemplateProps {
  presupuesto: Presupuesto;
  negocio: Negocio;
}

const PresupuestoPDFTemplate = React.forwardRef<HTMLDivElement, PresupuestoPDFTemplateProps>(
  ({ presupuesto, negocio }, ref) => {
    const formatearFecha = (fecha: string) => {
      try {
        return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
      } catch {
        return fecha;
      }
    };

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="border-b-2 border-blue-600 pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">CP DATA</h1>
              <p className="text-gray-600">Soluciones en Acreditación Digital</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">PRESUPUESTO</h2>
              <p className="text-lg font-semibold text-blue-600">{presupuesto.nombre}</p>
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
                    {producto.descripcion && (
                      <div className="text-sm text-gray-600 mt-1">{producto.descripcion}</div>
                    )}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">{producto.cantidad}</td>
                  <td className="border border-gray-300 p-3 text-right">{formatearPrecio(producto.precioUnitario)}</td>
                  <td className="border border-gray-300 p-3 text-right font-medium">{formatearPrecio(producto.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-100">
                <td colSpan={3} className="border border-gray-300 p-3 text-right font-bold text-lg">
                  TOTAL PRESUPUESTO:
                </td>
                <td className="border border-gray-300 p-3 text-right font-bold text-lg text-blue-600">
                  {formatearPrecio(presupuesto.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-blue-600 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-gray-800 mb-2">INFORMACIÓN DE CONTACTO</h4>
              <div className="text-sm space-y-1">
                <p>CP Data - Soluciones en Acreditación Digital</p>
                <p>Email: contacto@cpdata.cl</p>
                <p>Teléfono: +56 9 1234 5678</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Fecha Presupuesto:</span> {formatearFecha(presupuesto.fechaCreacion)}</p>
                <p><span className="font-semibold">Negocio:</span> #{negocio.numero}</p>
                <p><span className="font-semibold">Estado:</span> {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Este presupuesto tiene una validez de 30 días desde la fecha de emisión.</p>
            <p>Los precios incluyen IVA y están expresados en pesos chilenos (CLP).</p>
          </div>
        </div>
      </div>
    );
  }
);

PresupuestoPDFTemplate.displayName = 'PresupuestoPDFTemplate';

export default PresupuestoPDFTemplate;
