
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';
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

  const handleCellClick = () => {
    onVerNegocio(negocio.id);
  };

  const clickableCellClasses = "cursor-pointer hover:bg-slate-50 transition-colors text-blue-600 hover:text-blue-800 hover:underline";

  return (
    <TableRow className="hover:bg-slate-50/50">
      <TableCell 
        className={`font-medium ${clickableCellClasses}`}
        onClick={handleCellClick}
      >
        #{negocio.numero}
      </TableCell>
      <TableCell 
        className={clickableCellClasses}
        onClick={handleCellClick}
      >
        <div>
          <div className="font-medium">
            {negocio.contacto.nombre} {negocio.contacto.apellido}
          </div>
          <div className="text-sm text-gray-500">{negocio.contacto.email}</div>
        </div>
      </TableCell>
      <TableCell 
        className={clickableCellClasses}
        onClick={handleCellClick}
      >
        {obtenerNombreEmpresa(negocio)}
      </TableCell>
      <TableCell 
        className={clickableCellClasses}
        onClick={handleCellClick}
      >
        {negocio.evento.nombreEvento}
      </TableCell>
      <TableCell>
        {negocio.evento.fechaEvento ? formatearFecha(negocio.evento.fechaEvento) : 'Por definir'}
      </TableCell>
      <TableCell className="font-semibold">
        {formatearPrecio(valorTotal)}
      </TableCell>
      <TableCell>
        <BusinessStateSelect
          negocio={negocio}
          onStateChange={handleEstadoChange}
          size="sm"
        />
      </TableCell>
    </TableRow>
  );
};

export default BusinessTableRow;
