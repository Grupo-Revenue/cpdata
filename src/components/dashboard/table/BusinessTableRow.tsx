
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';
import HubSpotSyncButton from '@/components/hubspot/HubSpotSyncButton';
import { Negocio } from '@/types';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import { useNegocio } from '@/context/NegocioContext';

interface BusinessTableRowProps {
  negocio: Negocio;
  onVerNegocio: (negocioId: string) => void;
}

const BusinessTableRow: React.FC<BusinessTableRowProps> = ({ 
  negocio, 
  onVerNegocio 
}) => {
  const { cambiarEstadoNegocio } = useNegocio();

  const obtenerNombreEmpresa = (negocio: Negocio) => {
    if (negocio.productora) {
      return negocio.productora.nombre;
    }
    if (negocio.clienteFinal) {
      return negocio.clienteFinal.nombre;
    }
    return 'Sin empresa asignada';
  };

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const valorTotal = calcularValorNegocio(negocio);

  const handleEstadoChange = async (negocioId: string, nuevoEstado: string) => {
    await cambiarEstadoNegocio(negocioId, nuevoEstado);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">#{negocio.numero}</TableCell>
      <TableCell>
        <div>
          <div className="font-medium">
            {negocio.contacto.nombre} {negocio.contacto.apellido}
          </div>
          <div className="text-sm text-gray-500">{negocio.contacto.email}</div>
        </div>
      </TableCell>
      <TableCell>{obtenerNombreEmpresa(negocio)}</TableCell>
      <TableCell>{negocio.evento.nombreEvento}</TableCell>
      <TableCell>
        <BusinessStateSelect
          negocio={negocio}
          onStateChange={handleEstadoChange}
          size="sm"
        />
      </TableCell>
      <TableCell className="font-semibold">
        {formatearPrecio(valorTotal)}
      </TableCell>
      <TableCell>
        {negocio.evento.fechaEvento ? formatearFecha(negocio.evento.fechaEvento) : 'Por definir'}
      </TableCell>
      <TableCell>
        <HubSpotSyncButton
          negocio={negocio}
          variant="outline"
          size="sm"
          showText={false}
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
