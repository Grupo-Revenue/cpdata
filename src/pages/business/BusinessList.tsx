import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Eye, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/hooks/useNavigation';
import { formatDate } from '@/utils/formatters';

interface Negocio {
  id: string;
  numero: number;
  nombre_evento: string;
  tipo_evento: string;
  fecha_evento: string | null;
  locacion: string;
  estado: string;
  cantidad_asistentes: number | null;
  contacto_id: string;
  created_at: string;
}

interface BusinessListProps {
  isOverview?: boolean;
}

const BusinessList: React.FC<BusinessListProps> = ({ isOverview = false }) => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { navegarADetalleNegocio, navegarACrearNegocio } = useNavigation();

  useEffect(() => {
    if (user) {
      fetchNegocios();
    }
  }, [user]);

  const fetchNegocios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(isOverview ? 5 : 50);

      if (error) throw error;
      setNegocios(data || []);
    } catch (error) {
      console.error('Error fetching negocios:', error);
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
      oportunidad_creada: 'Oportunidad'
    };
    return labels[estado] || estado;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (negocios.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No hay negocios</h3>
              <p className="text-muted-foreground">
                Comienza creando tu primer negocio
              </p>
            </div>
            <Button onClick={navegarACrearNegocio} className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Crear Negocio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!isOverview && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Negocios</h2>
            <p className="text-muted-foreground">
              Gestiona tus oportunidades de negocio
            </p>
          </div>
          <Button onClick={navegarACrearNegocio} className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Negocio
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {negocios.map((negocio) => (
          <Card key={negocio.id} className="hover-lift">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    #{negocio.numero} - {negocio.nombre_evento}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {negocio.tipo_evento}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getEstadoBadgeVariant(negocio.estado)}>
                    {getEstadoLabel(negocio.estado)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navegarADetalleNegocio(negocio.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {negocio.fecha_evento ? formatDate(negocio.fecha_evento) : 'Sin fecha'}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {negocio.locacion}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  {negocio.cantidad_asistentes || 0} asistentes
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BusinessList;