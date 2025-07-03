import React from 'react';
import { useBrandConfig } from '@/hooks/useBrandConfig';

const PDFFooter: React.FC = () => {
  const { config: brandConfig } = useBrandConfig();

  return (
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
  );
};

export default PDFFooter;