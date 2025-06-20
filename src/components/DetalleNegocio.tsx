
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNegocio } from '@/context/NegocioContext';
import { ArrowLeft, Plus, Edit, Trash2, Building2, User, Calendar, MapPin, Mail, Phone, Loader2, FileText, Download } from 'lucide-react';
import CrearPresupuesto from './CrearPresupuesto';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearPrecio } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

interface DetalleNegocioProps {
  negocioId: string;
  onVolver: () => void;
}

const DetalleNegocio: React.FC<DetalleNegocioProps> = ({ negocioId, onVolver }) => {
  const { obtenerNegocio, eliminarPresupuesto, loading } = useNegocio();
  const navigate = useNavigate();
  const [mostrarCrearPresupuesto, setMostrarCrearPresupuesto] = useState(false);
  const [presupuestoEditando, setPresupuestoEditando] = useState<string | null>(null);
  const [eliminandoPresupuesto, setEliminandoPresupuesto] = useState<string | null>(null);

  const negocio = obtenerNegocio(negocioId);

  if (loading && !negocio) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando negocio...</p>
        </div>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div className="text-center py-8">
        <p>Negocio no encontrado</p>
        <Button onClick={onVolver} className="mt-4">Volver</Button>
      </div>
    );
  }

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  const obtenerBadgeEstadoPresupuesto = (estado: string) => {
    const colores = {
      borrador: 'bg-gray-100 text-gray-800',
      enviado: 'bg-blue-100 text-blue-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const handleEliminarPresupuesto = async (presupuestoId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este presupuesto?')) {
      setEliminandoPresupuesto(presupuestoId);
      try {
        await eliminarPresupuesto(negocioId, presupuestoId);
      } catch (error) {
        console.error('Error eliminando presupuesto:', error);
      } finally {
        setEliminandoPresupuesto(null);
      }
    }
  };

  const handleVerPDF = (presupuestoId: string) => {
    navigate(`/presupuesto/${negocioId}/${presupuestoId}/pdf`);
  };

  if (mostrarCrearPresupuesto) {
    return (
      <CrearPresupuesto
        negocioId={negocioId}
        presupuestoId={presupuestoEditando}
        onCerrar={() => {
          setMostrarCrearPresupuesto(false);
          setPresupuestoEditando(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onVolver}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Negocio #{negocio.numero}</h1>
            <p className="text-gray-600">{negocio.evento.nombreEvento}</p>
          </div>
        </div>
        <Badge className={`px-3 py-1 ${negocio.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {negocio.estado.charAt(0).toUpperCase() + negocio.estado.slice(1)}
        </Badge>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{negocio.contacto.nombre} {negocio.contacto.apellido}</p>
              {negocio.contacto.cargo && <p className="text-sm text-gray-600">{negocio.contacto.cargo}</p>}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              {negocio.contacto.email}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              {negocio.contacto.telefono}
            </div>
          </CardContent>
        </Card>

        {/* Empresas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Empresas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {negocio.productora && (
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-blue-700">Productora</p>
                <p className="text-sm">{negocio.productora.nombre}</p>
                {negocio.productora.rut && <p className="text-xs text-gray-600">RUT: {negocio.productora.rut}</p>}
              </div>
            )}
            {negocio.clienteFinal && (
              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-medium text-green-700">Cliente Final</p>
                <p className="text-sm">{negocio.clienteFinal.nombre}</p>
                {negocio.clienteFinal.rut && <p className="text-xs text-gray-600">RUT: {negocio.clienteFinal.rut}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información del Evento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Información del Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Tipo de Evento</p>
              <p>{negocio.evento.tipoEvento}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Fecha</p>
              <p>{negocio.evento.fechaEvento ? formatearFecha(negocio.evento.fechaEvento) : 'Por definir'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Horas de Acreditación</p>
              <p>{negocio.evento.horasAcreditacion}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Asistentes Esperados</p>
              <p>{negocio.evento.cantidadAsistentes}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Invitados</p>
              <p>{negocio.evento.cantidadInvitados}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-gray-600">Locación</p>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                <p>{negocio.evento.locacion}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presupuestos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Presupuestos ({negocio.presupuestos.length})</CardTitle>
            <Button onClick={() => setMostrarCrearPresupuesto(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Crear Presupuesto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {negocio.presupuestos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No hay presupuestos para este negocio</p>
              <Button onClick={() => setMostrarCrearPresupuesto(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Presupuesto
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {negocio.presupuestos.map((presupuesto) => (
                <div key={presupuesto.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-lg">{presupuesto.nombre}</h3>
                        <Badge className={obtenerBadgeEstadoPresupuesto(presupuesto.estado)}>
                          {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {presupuesto.productos.length} producto{presupuesto.productos.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatearPrecio(presupuesto.total)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Creado: {formatearFecha(presupuesto.fechaCreacion)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerPDF(presupuesto.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPresupuestoEditando(presupuesto.id);
                          setMostrarCrearPresupuesto(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEliminarPresupuesto(presupuesto.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={eliminandoPresupuesto === presupuesto.id}
                      >
                        {eliminandoPresupuesto === presupuesto.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Lista de productos */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="space-y-1">
                      {presupuesto.productos.map((producto) => (
                        <div key={producto.id} className="flex justify-between text-sm">
                          <span>{producto.nombre} (x{producto.cantidad})</span>
                          <span className="font-medium">{formatearPrecio(producto.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetalleNegocio;
