
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, Building2, User } from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import BusinessStateBadge from '@/components/business/BusinessStateBadge';

interface BusinessTableRowProps {
  negocio: Negocio;
  onVerNegocio: (id: string) => void;
}

const BusinessTableRow: React.FC<BusinessTableRowProps> = ({ negocio, onVerNegocio }) => {
  const valorTotal = calcularValorNegocio(negocio);
  
  const obtenerNombreEmpresa = () => {
    if (negocio.productora) {
      return negocio.productora.nombre;
    }
    if (negocio.clienteFinal) {
      return negocio.clienteFinal.nombre;
    }
    return 'Sin empresa asignada';
  };

  const handleVerClick = () => {
    console.log('[BusinessTableRow] Ver button clicked for negocio:', negocio.id);
    console.log('[BusinessTableRow] Negocio data:', {
      id: negocio.id,
      numero: negocio.numero,
      estado: negocio.estado,
      contacto: negocio.contacto?.nombre
    });
    
    try {
      onVerNegocio(negocio.id);
      console.log('[BusinessTableRow] onVerNegocio called successfully');
    } catch (error) {
      console.error('[BusinessTableRow] Error calling onVerNegocio:', error);
    }
  };

  return (
    <TableRow className="hover:bg-slate-50 transition-colors">
      <TableCell className="font-medium text-slate-800">
        #{negocio.numero}
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-sm">
            {negocio.contacto.nombre} {negocio.contacto.apellido}
          </span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{obtenerNombreEmpresa()}</span>
        </div>
      </TableCell>
      
      <TableCell className="font-medium">
        {negocio.evento.nombreEvento}
      </TableCell>
      
      <TableCell>
        <BusinessStateBadge estado={negocio.estado} />
      </TableCell>
      
      <TableCell className="text-right font-semibold text-slate-800">
        {formatearPrecio(valorTotal)}
      </TableCell>
      
      <TableCell>
        <div className="flex items-center text-sm text-slate-600">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date(negocio.fechaCreacion).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          })}
        </div>
      </TableCell>
      
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={handleVerClick}
          className="h-8 px-3"
        >
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default BusinessTableRow;
