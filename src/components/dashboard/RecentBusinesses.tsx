
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNegocio } from '@/context/NegocioContext';
import { Building2, Plus, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateBusinessValue } from '@/utils/businessValueCalculator';
import { obtenerEstadoNegocioInfo, formatBusinessStateForDisplay } from '@/utils/businessCalculations';
import { formatearPrecio, formatearFechaSinZonaHoraria } from '@/utils/formatters';

interface RecentBusinessesProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const RecentBusinesses: React.FC<RecentBusinessesProps> = ({ onCrearNegocio, onVerNegocio }) => {
  const { negocios } = useNegocio();

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  const negociosRecientes = negocios.slice(0, 6);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Negocios Recientes</span>
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          Ver todos
        </Button>
      </CardHeader>
      <CardContent>
        {negocios.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay negocios aún</h3>
            <p className="text-gray-600 mb-4">Comience creando su primer negocio</p>
            <Button onClick={onCrearNegocio} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Negocio
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {negociosRecientes.map((negocio) => {
              const valorNegocio = calculateBusinessValue(negocio);
              const { colorEstado } = obtenerEstadoNegocioInfo(negocio);
              
              return (
                <div 
                  key={negocio.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onVerNegocio(negocio.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            Negocio #{negocio.numero}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {negocio.contacto.nombre} {negocio.contacto.apellido}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {valorNegocio > 0 ? formatearPrecio(valorNegocio) : '$0'}
                          </div>
                          {valorNegocio === 0 && (
                            <span className="text-xs text-gray-500">Sin presupuestos</span>
                          )}
                        </div>
                        <Badge className={`${colorEstado} border`}>
                          {formatBusinessStateForDisplay(negocio.estado)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{negocio.evento.nombreEvento}</span>
                      </div>
                      {negocio.evento.fechaEvento && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{formatearFechaSinZonaHoraria(negocio.evento.fechaEvento)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentBusinesses;
