import React from 'react';
import { useBrandConfig } from '@/hooks/useBrandConfig';
import { useBudgetTermsConfig } from '@/hooks/useBudgetTermsConfig';

const PDFFooter: React.FC = () => {
  const { config: brandConfig } = useBrandConfig();
  const { config: termsConfig } = useBudgetTermsConfig();

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
              <div className="space-y-1">
                {(termsConfig?.terminos_pago_entrega || 
                  'Los precios incluyen IVA y están expresados en pesos chilenos\n• Este presupuesto tiene validez de 30 días desde la fecha de emisión\n• Forma de pago: 50% anticipo, 50% contra entrega\n• Tiempo de entrega: 7-10 días hábiles desde confirmación del pedido')
                  .split('\n')
                  .filter(line => line.trim())
                  .map((line, index) => (
                    <div key={index}>
                      {line.startsWith('•') ? line : `• ${line}`}
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">GARANTÍAS Y SERVICIOS:</p>
              <div className="space-y-1">
                {(termsConfig?.terminos_garantias || 
                  'Garantía de 12 meses en equipos y 6 meses en servicios\n• Soporte técnico 24/7 durante el evento\n• Capacitación incluida para el uso de los sistemas\n• Los servicios se ejecutarán según especificaciones técnicas acordadas')
                  .split('\n')
                  .filter(line => line.trim())
                  .map((line, index) => (
                    <div key={index}>
                      {line.startsWith('•') ? line : `• ${line}`}
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 text-center">
            <p className="font-semibold text-gray-700">
              {termsConfig?.certificacion_texto || 'Empresa certificada en normas ISO 9001:2015 | Registrada en ChileCompra'}
            </p>
            <p className="text-gray-600 mt-1">
              {termsConfig?.documento_texto || 'Este documento constituye una propuesta comercial sujeta a aceptación formal'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFFooter;