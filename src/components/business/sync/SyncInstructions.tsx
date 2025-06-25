
import React from 'react';

const SyncInstructions: React.FC = () => {
  return (
    <div className="text-xs text-gray-600 space-y-1">
      <p><strong>Sincronizar a HubSpot:</strong> Envía los datos actuales de la app a HubSpot</p>
      <p><strong>Forzar Sincronización:</strong> Fuerza la actualización incluso si no hay cambios detectados</p>
      <p><strong>Sincronizar desde HubSpot:</strong> Obtiene los datos más recientes desde HubSpot</p>
    </div>
  );
};

export default SyncInstructions;
