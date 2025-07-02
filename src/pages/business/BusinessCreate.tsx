import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/hooks/useNavigation';
import { useToast } from '@/hooks/use-toast';

interface Contacto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

interface Empresa {
  id: string;
  nombre: string;
  tipo: string;
}

const BusinessCreate = () => {
  const [loading, setLoading] = useState(false);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const { user } = useAuth();
  const { volverADashboard, completarCreacionNegocio } = useNavigation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre_evento: '',
    tipo_evento: '',
    fecha_evento: '',
    locacion: '',
    cantidad_asistentes: '',
    cantidad_invitados: '',
    horas_acreditacion: '',
    contacto_id: '',
    productora_id: '',
    cliente_final_id: ''
  });

  useEffect(() => {
    if (user) {
      fetchContactos();
      fetchEmpresas();
    }
  }, [user]);

  const fetchContactos = async () => {
    try {
      const { data, error } = await supabase
        .from('contactos')
        .select('id, nombre, apellido, email')
        .eq('user_id', user?.id)
        .order('nombre');

      if (error) throw error;
      setContactos(data || []);
    } catch (error) {
      console.error('Error fetching contactos:', error);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nombre, tipo')
        .eq('user_id', user?.id)
        .order('nombre');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Error fetching empresas:', error);
    }
  };

  const getNextBusinessNumber = async () => {
    try {
      // Get user counter
      const { data: counterData, error: counterError } = await supabase
        .from('contadores_usuario')
        .select('contador_negocio')
        .eq('user_id', user?.id)
        .single();

      if (counterError && counterError.code !== 'PGRST116') {
        throw counterError;
      }

      let nextNumber = 17659; // Default starting number
      if (counterData) {
        nextNumber = counterData.contador_negocio + 1;
      }

      // Update counter
      await supabase
        .from('contadores_usuario')
        .upsert({
          user_id: user?.id,
          contador_negocio: nextNumber,
          updated_at: new Date().toISOString()
        });

      return nextNumber;
    } catch (error) {
      console.error('Error getting next business number:', error);
      return 17659;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const nextNumber = await getNextBusinessNumber();

      const negocioData = {
        user_id: user.id,
        numero: nextNumber,
        nombre_evento: formData.nombre_evento,
        tipo_evento: formData.tipo_evento,
        fecha_evento: formData.fecha_evento || null,
        locacion: formData.locacion,
        cantidad_asistentes: formData.cantidad_asistentes ? parseInt(formData.cantidad_asistentes) : null,
        cantidad_invitados: formData.cantidad_invitados ? parseInt(formData.cantidad_invitados) : null,
        horas_acreditacion: formData.horas_acreditacion,
        contacto_id: formData.contacto_id,
        productora_id: formData.productora_id || null,
        cliente_final_id: formData.cliente_final_id || null,
        estado: 'oportunidad_creada' as const
      };

      const { data, error } = await supabase
        .from('negocios')
        .insert(negocioData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Negocio creado',
        description: `Negocio #${nextNumber} creado exitosamente`,
      });

      completarCreacionNegocio(data.id);
    } catch (error) {
      console.error('Error creating business:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el negocio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={volverADashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Negocio</h1>
          <p className="text-muted-foreground">
            Crea una nueva oportunidad de negocio
          </p>
        </div>
      </div>

      <Card className="modern-card">
        <CardHeader>
          <CardTitle>Información del Evento</CardTitle>
          <CardDescription>
            Completa los detalles básicos del evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre_evento">Nombre del Evento *</Label>
                <Input
                  id="nombre_evento"
                  value={formData.nombre_evento}
                  onChange={(e) => handleInputChange('nombre_evento', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_evento">Tipo de Evento *</Label>
                <Input
                  id="tipo_evento"
                  value={formData.tipo_evento}
                  onChange={(e) => handleInputChange('tipo_evento', e.target.value)}
                  placeholder="ej: Conferencia, Boda, Concierto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_evento">Fecha del Evento</Label>
                <Input
                  id="fecha_evento"
                  type="date"
                  value={formData.fecha_evento}
                  onChange={(e) => handleInputChange('fecha_evento', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locacion">Ubicación *</Label>
                <Input
                  id="locacion"
                  value={formData.locacion}
                  onChange={(e) => handleInputChange('locacion', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad_asistentes">Cantidad de Asistentes</Label>
                <Input
                  id="cantidad_asistentes"
                  type="number"
                  value={formData.cantidad_asistentes}
                  onChange={(e) => handleInputChange('cantidad_asistentes', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad_invitados">Cantidad de Invitados</Label>
                <Input
                  id="cantidad_invitados"
                  type="number"
                  value={formData.cantidad_invitados}
                  onChange={(e) => handleInputChange('cantidad_invitados', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horas_acreditacion">Horas de Acreditación *</Label>
                <Input
                  id="horas_acreditacion"
                  value={formData.horas_acreditacion}
                  onChange={(e) => handleInputChange('horas_acreditacion', e.target.value)}
                  placeholder="ej: 09:00 - 18:00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacto_id">Contacto *</Label>
                <Select value={formData.contacto_id} onValueChange={(value) => handleInputChange('contacto_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un contacto" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactos.map((contacto) => (
                      <SelectItem key={contacto.id} value={contacto.id}>
                        {contacto.nombre} {contacto.apellido} - {contacto.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productora_id">Productora</Label>
                <Select value={formData.productora_id} onValueChange={(value) => handleInputChange('productora_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una productora" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.filter(e => e.tipo === 'productora').map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente_final_id">Cliente Final</Label>
                <Select value={formData.cliente_final_id} onValueChange={(value) => handleInputChange('cliente_final_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente final" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.filter(e => e.tipo === 'cliente_final').map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={volverADashboard}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="gradient-primary">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Crear Negocio'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessCreate;