
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNegocio } from '@/context/NegocioContext';
import { Plus, Building2, Calendar, Users, MapPin, FileText, Loader2, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  const obtenerBadgeEstado = (estado: string) => {
    const colores = {
      activo: 'bg-blue-100 text-blue-800',
      cerrado: 'bg-gray-100 text-gray-800',
      cancelado: 'bg-red-100 text-red-800',
      prospecto: 'bg-yellow-100 text-yellow-800',
      perdido: 'bg-red-100 text-red-800',
      ganado: 'bg-green-100 text-green-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'ganado':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'perdido':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'prospecto':
        return <Target className="w-4 h-4 text-yellow-600" />;
      default:
        return <Building2 className="w-4 h-4 text-blue-600" />;
    }
  };

  // Estadísticas por estado
  const estadisticas = {
    total: negocios.length,
    prospectos: negocios.filter(n => n.estado === 'prospecto').length,
    activos: negocios.filter(n => n.estado === 'activo').length,
    ganados: negocios.filter(n => n.estado === 'ganado').length,
    perdidos: negocios.filter(n => n.estado === 'perdido').length,
    totalPresupuestos: negocios.reduce((total, n) => total + n.presupuestos.length, 0)
  };

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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Negocios</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Prospectos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.prospectos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.activos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ganados</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.ganados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Perdidos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.perdidos}</p>
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
            {negocios.map((negocio) => (
              <Card key={negocio.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onVerNegocio(negocio.id)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {obtenerIconoEstado(negocio.estado)}
                      <CardTitle className="text-lg">Negocio #{negocio.numero}</CardTitle>
                    </div>
                    <Badge className={obtenerBadgeEstado(negocio.estado)}>
                      {negocio.estado.charAt(0).toUpperCase() + negocio.estado.slice(1)}
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
                      {negocio.evento.fechaEvento ? formatearFecha(negocio.evento.fechaEvento) : 'Fecha por definir'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2" />
                      {negocio.presupuestos.length} presupuesto{negocio.presupuestos.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Creado: {formatearFecha(negocio.fechaCreacion)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardNegocios;
