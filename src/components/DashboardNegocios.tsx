
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNegocio } from '@/context/NegocioContext';
import { Plus, Building2, Calendar, Users, MapPin, FileText, Loader2, TrendingUp, TrendingDown, Target, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { obtenerEstadisticasDashboard, obtenerEstadoNegocioInfo, formatBusinessStateForDisplay } from '@/utils/businessCalculations';
import { formatearPrecio, formatearFechaSinZonaHoraria } from '@/utils/formatters';

interface DashboardProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const DashboardNegocios: React.FC<DashboardProps> = ({ onCrearNegocio, onVerNegocio }) => {
  const { negocios, loading } = useNegocio();

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'oportunidad_creada':
        return <Target className="w-4 h-4 text-business-oportunidad-foreground" />;
      case 'presupuesto_enviado':
        return <Clock className="w-4 h-4 text-business-presupuesto-foreground" />;
      case 'parcialmente_aceptado':
        return <TrendingUp className="w-4 h-4 text-business-parcial-foreground" />;
      case 'negocio_aceptado':
        return <CheckCircle className="w-4 h-4 text-business-aceptado-foreground" />;
      case 'negocio_cerrado':
        return <TrendingUp className="w-4 h-4 text-business-cerrado-foreground" />;
      case 'negocio_perdido':
        return <TrendingDown className="w-4 h-4 text-business-perdido-foreground" />;
      default:
        return <Building2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Use the enhanced statistics function
  const estadisticas = obtenerEstadisticasDashboard(negocios);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando negocios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Cotización CP Data</h1>
          <p className="text-gray-600">Gestión de negocios y presupuestos para servicios de acreditación</p>
        </div>
        <Button onClick={onCrearNegocio} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Crear Nuevo Negocio
        </Button>
      </div>

      {/* Enhanced Statistics with new business states */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Negocios</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalNegocios}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-slate-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Oportunidades</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.estadisticasPorEstado.oportunidad_creada}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.estadisticasPorEstado.presupuesto_enviado}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aceptados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.estadisticasPorEstado.negocio_aceptado + estadisticas.estadisticasPorEstado.parcialmente_aceptado}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cerrados</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.estadisticasPorEstado.negocio_cerrado}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Presupuestos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalPresupuestos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Negocios */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Negocios Recientes</h2>
        {negocios.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay negocios aún</h3>
              <p className="text-gray-600 mb-4">Comience creando su primer negocio</p>
              <Button onClick={onCrearNegocio} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Negocio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {negocios.map((negocio) => {
              const { colorEstado } = obtenerEstadoNegocioInfo(negocio);
              
              return (
                <Card key={negocio.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => onVerNegocio(negocio.id)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        {obtenerIconoEstado(negocio.estado)}
                        <CardTitle className="text-lg">Negocio #{negocio.numero}</CardTitle>
                      </div>
                      <Badge className={colorEstado}>
                        {formatBusinessStateForDisplay(negocio.estado)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {negocio.contacto.nombre} {negocio.contacto.apellido}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Building2 className="w-4 h-4 mr-2" />
                        {negocio.productora?.nombre || negocio.clienteFinal?.nombre}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {negocio.evento.nombreEvento}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {negocio.evento.fechaEvento ? formatearFechaSinZonaHoraria(negocio.evento.fechaEvento) : 'Fecha por definir'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="w-4 h-4 mr-2" />
                        {negocio.presupuestos.length} presupuesto{negocio.presupuestos.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        Creado: {formatearFechaSinZonaHoraria(negocio.fechaCreacion)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardNegocios;
