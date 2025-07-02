
import React from 'react';
import { Button } from '@/components/ui/button';

interface BusinessNotFoundProps {
  onVolver: () => void;
}

const BusinessNotFound: React.FC<BusinessNotFoundProps> = ({ onVolver }) => {
  return (
    <div className="text-center py-12 w-full">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Negocio no encontrado</h3>
        <p className="text-red-600 mb-4">
          No se pudo encontrar el negocio solicitado.
        </p>
        <Button onClick={onVolver} variant="outline">Volver al Dashboard</Button>
      </div>
    </div>
  );
};

export default BusinessNotFound;
