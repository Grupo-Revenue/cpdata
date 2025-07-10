import React from 'react';
import { useBrandConfig } from '@/hooks/useBrandConfig';

const PDFFooter: React.FC = () => {
  const { config: brandConfig } = useBrandConfig();

  return (
    <div className="border-t-2 border-gray-800 pt-6 mt-8">
      {/* Contact Information */}
      <div className="mb-6">
        <h4 className="font-bold text-gray-800 mb-3 text-lg">INFORMACIÓN DE CONTACTO</h4>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-semibold text-gray-800">{brandConfig?.nombre_empresa || 'CP Data SpA'}</p>
            <p className="text-gray-600">Soluciones Profesionales en Acreditación Digital</p>
            {brandConfig?.direccion && <p className="text-gray-600">Dirección: {brandConfig.direccion}</p>}
            <p className="text-gray-600">RUT: 76.XXX.XXX-X</p>
          </div>
          <div>
            <p className="text-gray-600">Email: {brandConfig?.email || 'contacto@cpdata.cl'}</p>
            <p className="text-gray-600">Teléfono: {brandConfig?.telefono || '+56 9 1234 5678'}</p>
            {brandConfig?.sitio_web && <p className="text-gray-600">Web: {brandConfig.sitio_web}</p>}
            <p className="text-gray-600">Giro: Servicios de Tecnología y Acreditación</p>
          </div>
        </div>
      </div>
      
      {/* Terms and Conditions */}
      <div className="border-t border-gray-300 pt-4">
        <h4 className="font-bold text-gray-800 mb-3">TÉRMINOS Y CONDICIONES GENERALES</h4>
        <div className="text-xs text-gray-600 leading-relaxed space-y-2">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-gray-700 mb-1">CONDICIONES DE PAGO Y ENTREGA:</p>
              <ul className="space-y-1">
                <li>• Los precios incluyen IVA y están expresados en pesos chilenos</li>
                <li>• Este presupuesto tiene validez de 30 días desde la fecha de emisión</li>
                <li>• Forma de pago: 50% anticipo, 50% contra entrega</li>
                <li>• Tiempo de entrega: 7-10 días hábiles desde confirmación del pedido</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">GARANTÍAS Y SERVICIOS:</p>
              <ul className="space-y-1">
                <li>• Garantía de 12 meses en equipos y 6 meses en servicios</li>
                <li>• Soporte técnico 24/7 durante el evento</li>
                <li>• Capacitación incluida para el uso de los sistemas</li>
                <li>• Los servicios se ejecutarán según especificaciones técnicas acordadas</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 text-center">
            <p className="font-semibold text-gray-700">
              Empresa certificada en normas ISO 9001:2015 | Registrada en ChileCompra
            </p>
            <p className="text-gray-600 mt-1">
              Este documento constituye una propuesta comercial sujeta a aceptación formal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFFooter;