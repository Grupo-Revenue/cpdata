import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, User, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Contacto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo: string | null;
  created_at: string;
}

const ContactList = () => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchContactos();
    }
  }, [user]);

  const fetchContactos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contactos')
        .select('*')
        .eq('user_id', user?.id)
        .order('nombre');

      if (error) throw error;
      setContactos(data || []);
    } catch (error) {
      console.error('Error fetching contactos:', error);
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-bold">Contactos</h2>
          <p className="text-muted-foreground">
            Gestiona tu base de contactos
          </p>
        </div>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Contacto
        </Button>
      </div>

      {contactos.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No hay contactos</h3>
                <p className="text-muted-foreground">
                  Comienza agregando tu primer contacto
                </p>
              </div>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Crear Contacto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contactos.map((contacto) => (
            <Card key={contacto.id} className="hover-lift">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {contacto.nombre} {contacto.apellido}
                    </CardTitle>
                    {contacto.cargo && (
                      <CardDescription>{contacto.cargo}</CardDescription>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    <a href={`mailto:${contacto.email}`} className="text-primary hover:underline">
                      {contacto.email}
                    </a>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    <a href={`tel:${contacto.telefono}`} className="text-primary hover:underline">
                      {contacto.telefono}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactList;