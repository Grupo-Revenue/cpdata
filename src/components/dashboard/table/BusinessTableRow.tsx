
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TableCell, 
  TableRow 
} from '@/components/ui/table';
import { calcularValorNegocio, obtenerEstadoNegocioInfo } from '@/utils/businessCalculations';
import { formatearPrecio } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import { Negocio } from '@/types';
import HubSpotSyncButton from '@/components/hubspot/HubSpotSyncButton';

interface BusinessTableRowProps {
  negocio: Negocio;
  onVerNegocio: (negocioId: string) => void;
}

const BusinessTableRow: React.FC<BusinessTableRowProps> = ({ negocio, onVerNegocio }) => {
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha por definir';
    }
  };

  const obtenerNombreEmpresa = (negocio: Negocio) => {
    if (negocio.productora) {
      return negocio.productora.nombre;
    }
    if (negocio.clienteFinal) {
      return negocio.clienteFinal.nombre;
    }
    return 'Sin empresa asignada';
  };

  const { colorEstado } = obtenerEstadoNegocioInfo(negocio);
  const valorTotal = calcularValorNegocio(negocio);

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">
        #{negocio.numero}
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">
            {negocio.contacto.nombre} {negocio.contacto.apellido}
          </div>
          <div className="text-sm text-gray-500">
            {negocio.contacto.email}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">
          {obtenerNombreEmpresa(negocio)}
        </div>
        {negocio.productora && negocio.clienteFinal && (
          <div className="text-sm text-gray-500">
            Cliente: {negocio.clienteFinal.nombre}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="font-medium">
          {negocio.evento.nombreEvento}
        </div>
        <div className="text-sm text-gray-500">
          {negocio.evento.tipoEvento}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={`${colorEstado} border`}>
          {negocio.estado.replace('_', ' ').toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        {valorTotal > 0 ? formatearPrecio(valorTotal) : 'Sin presupuestos'}
      </TableCell>
      <TableCell>
        {negocio.evento.fechaEvento 
          ? formatearFecha(negocio.evento.fechaEvento)
          : 'Por definir'
        }
      </TableCell>
      <TableCell>
        <HubSpotSyncButton 
          negocio={negocio} 
          showText={false}
          variant="ghost"
        />
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onVerNegocio(negocio.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default BusinessTableRow;
