import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Globe, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Empresa {
  id: string;
  nombre: string;
  tipo: 'productora' | 'cliente_final';
  rut: string | null;
  direccion: string | null;
  sitio_web: string | null;
  created_at: string;
}

const CompanyList = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEmpresas();
    }
  }, [user]);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user?.id)
        .order('nombre');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Error fetching empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    return tipo === 'productora' ? 'default' : 'secondary';
  };

  const getTipoLabel = (tipo: string) => {
    return tipo === 'productora' ? 'Productora' : 'Cliente Final';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Empresas</h2>
          <p className="text-muted-foreground">
            Gestiona productoras y clientes finales
          </p>
        </div>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      {empresas.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No hay empresas</h3>
                <p className="text-muted-foreground">
                  Comienza agregando tu primera empresa
                </p>
              </div>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Crear Empresa
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {empresas.map((empresa) => (
            <Card key={empresa.id} className="hover-lift">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{empresa.nombre}</CardTitle>
                    {empresa.rut && (
                      <CardDescription>RUT: {empresa.rut}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getTipoBadgeVariant(empresa.tipo)}>
                      {getTipoLabel(empresa.tipo)}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {empresa.direccion && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {empresa.direccion}
                    </div>
                  )}
                  {empresa.sitio_web && (
                    <div className="flex items-center text-muted-foreground">
                      <Globe className="h-4 w-4 mr-2" />
                      <a 
                        href={empresa.sitio_web} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {empresa.sitio_web}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyList;