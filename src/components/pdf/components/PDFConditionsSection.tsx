import React from 'react';

const PDFConditionsSection: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-gray-800 mb-4 text-lg border-b-2 border-gray-800 pb-1">
            CONDICIONES COMERCIALES
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">Validez de la Oferta:</span>
              <span>30 días calendario</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Forma de Pago:</span>
              <span>50% anticipo, 50% contra entrega</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Tiempo de Entrega:</span>
              <span>7-10 días hábiles</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Moneda:</span>
              <span>Pesos Chilenos (CLP)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Precios:</span>
              <span>Incluyen IVA</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 mb-4 text-lg border-b-2 border-gray-800 pb-1">
            OBSERVACIONES
          </h3>
          <div className="space-y-2 text-sm">
            <div>• Los precios incluyen configuración e instalación del sistema</div>
            <div>• Incluye capacitación al personal operativo</div>
            <div>• Soporte técnico durante el evento las 24 horas</div>
            <div>• Garantía de funcionamiento durante todo el evento</div>
            <div>• Los equipos quedan en comodato durante el evento</div>
            <div>• Se requiere conexión a internet estable en el lugar</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFConditionsSection;