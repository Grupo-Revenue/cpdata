import React from 'react';
import { useBudgetTermsConfig } from '@/hooks/useBudgetTermsConfig';

const PDFConditionsSection: React.FC = () => {
  const { config } = useBudgetTermsConfig();

  // Fallback values if config is not loaded
  const terms = config || {
    validez_oferta: '30 días calendario',
    forma_pago: '50% anticipo, 50% contra entrega',
    tiempo_entrega: '7-10 días hábiles',
    moneda: 'Pesos Chilenos (CLP)',
    precios_incluyen: 'Incluyen IVA',
    condicion_comercial_1: '',
    condicion_comercial_2: '',
    condicion_comercial_3: '',
    condicion_comercial_4: '',
    condicion_comercial_5: '',
    condicion_comercial_6: '',
    observacion_1: 'Los precios incluyen configuración e instalación del sistema',
    observacion_2: 'Incluye capacitación al personal operativo',
    observacion_3: 'Soporte técnico durante el evento las 24 horas',
    observacion_4: 'Garantía de funcionamiento durante todo el evento',
    observacion_5: 'Los equipos quedan en comodato durante el evento',
    observacion_6: 'Se requiere conexión a internet estable en el lugar'
  };

  const condicionesComerciales = [
    terms.condicion_comercial_1,
    terms.condicion_comercial_2,
    terms.condicion_comercial_3,
    terms.condicion_comercial_4,
    terms.condicion_comercial_5,
    terms.condicion_comercial_6
  ].filter(cond => cond && cond.trim() !== '');

  const observaciones = [
    terms.observacion_1,
    terms.observacion_2,
    terms.observacion_3,
    terms.observacion_4,
    terms.observacion_5,
    terms.observacion_6
  ].filter(obs => obs && obs.trim() !== '');

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-gray-800 mb-4 text-lg border-b-2 border-gray-800 pb-1">
            CONDICIONES COMERCIALES
          </h3>
          <div className="space-y-2 text-sm">
            {condicionesComerciales.map((condicion, index) => (
              <div key={index}>• {condicion}</div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 mb-4 text-lg border-b-2 border-gray-800 pb-1">
            OBSERVACIONES
          </h3>
          <div className="space-y-2 text-sm">
            {observaciones.map((observacion, index) => (
              <div key={index}>• {observacion}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFConditionsSection;