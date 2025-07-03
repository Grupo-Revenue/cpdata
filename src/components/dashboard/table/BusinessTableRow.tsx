
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, Building2, User } from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { useCalcularValorNegocio, getBusinessStateColors, formatBusinessStateForDisplay } from '@/utils/businessCalculations';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/utils/logger';

interface BusinessTableRowProps {
  negocio: Negocio;
  onVerNegocio: (id: string) => void;
}

const BusinessTableRow: React.FC<BusinessTableRowProps> = React.memo(({ negocio, onVerNegocio }) => {
  const valorTotal = useCalcularValorNegocio(negocio);
  
  const obtenerNombreEmpresa = React.useMemo(() => {
    if (negocio.productora) {
      return negocio.productora.nombre;
    }
    if (negocio.clienteFinal) {
      return negocio.clienteFinal.nombre;
    }
    return 'Sin empresa asignada';
  }, [negocio.productora, negocio.clienteFinal]);

  const handleVerClick = React.useCallback(() => {
    if (!negocio.id) {
      logger.error('BusinessTableRow: Negocio ID is missing');
      return;
    }
    
    try {
      onVerNegocio(negocio.id);
    } catch (error) {
      logger.error('BusinessTableRow: Error calling onVerNegocio', error);
    }
  }, [negocio.id, onVerNegocio]);

  return (
    <TableRow className="hover:bg-slate-50 transition-colors">
      <TableCell className="font-medium text-slate-800">
        #{negocio.numero}
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-sm">
            {negocio.contacto?.nombre} {negocio.contacto?.apellido}
          </span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{obtenerNombreEmpresa}</span>
        </div>
      </TableCell>
      
      <TableCell className="font-medium">
        {negocio.evento?.nombreEvento || 'Sin evento'}
      </TableCell>
      
      <TableCell>
        <div className="flex items-center text-sm text-slate-600">
          <Calendar className="w-3 h-3 mr-1" />
          {negocio.evento?.fechaEvento ? 
            new Date(negocio.evento.fechaEvento).toLocaleDateString('es-CL', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }) : 'Pendiente'
          }
        </div>
      </TableCell>
      
      <TableCell className="text-right font-semibold text-slate-800">
        {formatearPrecio(valorTotal)}
      </TableCell>
      
      <TableCell>
        <Badge 
          variant="outline"
          className={getBusinessStateColors(negocio.estado)}
        >
          {formatBusinessStateForDisplay(negocio.estado)}
        </Badge>
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
});

BusinessTableRow.displayName = 'BusinessTableRow';

export default BusinessTableRow;
