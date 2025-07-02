
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { Empresa } from '@/types';

interface EmpresasCardProps {
  productora?: Empresa;
  clienteFinal?: Empresa;
}

const EmpresasCard: React.FC<EmpresasCardProps> = ({ productora, clienteFinal }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Empresas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {productora && (
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="font-medium text-blue-700">Productora</p>
            <p className="text-sm">{productora.nombre}</p>
            {productora.rut && <p className="text-xs text-gray-600">RUT: {productora.rut}</p>}
          </div>
        )}
        {clienteFinal && (
          <div className="border-l-4 border-green-500 pl-4">
            <p className="font-medium text-green-700">Cliente Final</p>
            <p className="text-sm">{clienteFinal.nombre}</p>
            {clienteFinal.rut && <p className="text-xs text-gray-600">RUT: {clienteFinal.rut}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmpresasCard;
