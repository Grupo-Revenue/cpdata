
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';

interface BusinessTableEmptyProps {
  hasNoBusinesses: boolean;
  onCrearNegocio: () => void;
}

const BusinessTableEmpty: React.FC<BusinessTableEmptyProps> = ({ hasNoBusinesses, onCrearNegocio }) => {
  return (
    <div className="text-center py-12">
      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasNoBusinesses ? 'No hay negocios aún' : 'No se encontraron negocios'}
      </h3>
      <p className="text-gray-600 mb-4">
        {hasNoBusinesses 
          ? 'Comience creando su primer negocio' 
          : 'Intente ajustar los filtros de búsqueda'
        }
      </p>
      {hasNoBusinesses && (
        <Button onClick={onCrearNegocio} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Crear Primer Negocio
        </Button>
      )}
    </div>
  );
};

export default BusinessTableEmpty;
