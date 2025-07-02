import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, Building2, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigation } from '@/hooks/useNavigation';
import { formatDate } from '@/utils/formatters';

interface BusinessDetailProps {
  negocioId: string;
}

interface NegocioDetalle {
  id: string;
  numero: number;
  nombre_evento: string;
  tipo_evento: string;
  fecha_evento: string | null;
  locacion: string;
  estado: string;
  cantidad_asistentes: number | null;
  cantidad_invitados: number | null;
  horas_acreditacion: string;
  created_at: string;
  contacto: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    cargo: string | null;
  } | null;
  productora: {
    nombre: string;
    direccion: string | null;
  } | null;
  cliente_final: {
    nombre: string;
    direccion: string | null;
  } | null;
}

const BusinessDetail: React.FC<BusinessDetailProps> = ({ negocioId }) => {
  const [negocio, setNegocio] = useState<NegocioDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const { volverADashboard } = useNavigation();

  useEffect(() => {
    if (negocioId) {
      fetchNegocioDetalle();
    }
  }, [negocioId]);

  const fetchNegocioDetalle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('negocios')
        .select(`
          *,
          contacto:contactos(nombre, apellido, email, telefono, cargo),
          productora:empresas!negocios_productora_id_fkey(nombre, direccion),
          cliente_final:empresas!negocios_cliente_final_id_fkey(nombre, direccion)
        `)
        .eq('id', negocioId)
        .single();

      if (error) throw error;
      setNegocio(data);
    } catch (error) {
      console.error('Error fetching negocio detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'activo':
      case 'negocio_aceptado':
        return 'default';
      case 'negocio_cerrado':
        return 'secondary';
      case 'negocio_perdido':
        return 'destructive';
      case 'presupuesto_enviado':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      activo: 'Activo',
      negocio_aceptado: 'Aceptado',
      negocio_cerrado: 'Cerrado',
      negocio_perdido: 'Perdido',
      presupuesto_enviado: 'Presupuesto Enviado',
      oportunidad_creada: 'Oportunidad Creada'
    };
    return labels[estado] || estado;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={volverADashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p>Negocio no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={volverADashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              #{negocio.numero} - {negocio.nombre_evento}
            </h1>
            <p className="text-muted-foreground">{negocio.tipo_evento}</p>
          </div>
        </div>
        <Badge variant={getEstadoBadgeVariant(negocio.estado)} className="text-sm">
          {getEstadoLabel(negocio.estado)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle>Detalles del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha del Evento</p>
                    <p className="text-sm text-muted-foreground">
                      {negocio.fecha_evento ? formatDate(negocio.fecha_evento) : 'Sin fecha'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    <p className="text-sm text-muted-foreground">{negocio.locacion}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Asistentes</p>
                    <p className="text-sm text-muted-foreground">
                      {negocio.cantidad_asistentes || 0} asistentes
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Invitados</p>
                    <p className="text-sm text-muted-foreground">
                      {negocio.cantidad_invitados || 0} invitados
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Horas de Acreditación</p>
                <p className="text-sm text-muted-foreground">{negocio.horas_acreditacion}</p>
              </div>
            </CardContent>
          </Card>

          {/* Companies */}
          {(negocio.productora || negocio.cliente_final) && (
            <Card className="modern-card">
              <CardHeader>
                <CardTitle>Empresas Involucradas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {negocio.productora && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Productora</span>
                    </div>
                    <p className="text-sm">{negocio.productora.nombre}</p>
                    {negocio.productora.direccion && (
                      <p className="text-xs text-muted-foreground">{negocio.productora.direccion}</p>
                    )}
                  </div>
                )}

                {negocio.cliente_final && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Cliente Final</span>
                    </div>
                    <p className="text-sm">{negocio.cliente_final.nombre}</p>
                    {negocio.cliente_final.direccion && (
                      <p className="text-xs text-muted-foreground">{negocio.cliente_final.direccion}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          {negocio.contacto && (
            <Card className="modern-card">
              <CardHeader>
                <CardTitle>Contacto Principal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">
                    {negocio.contacto.nombre} {negocio.contacto.apellido}
                  </p>
                  {negocio.contacto.cargo && (
                    <p className="text-sm text-muted-foreground">{negocio.contacto.cargo}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${negocio.contacto.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {negocio.contacto.email}
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${negocio.contacto.telefono}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {negocio.contacto.telefono}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                Crear Presupuesto
              </Button>
              <Button variant="outline" className="w-full">
                Editar Negocio
              </Button>
              <Button variant="outline" className="w-full">
                Ver Presupuestos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;