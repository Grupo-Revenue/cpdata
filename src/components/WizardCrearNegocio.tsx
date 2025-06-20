import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useNegocio } from '@/context/NegocioContext';
import { TIPOS_EVENTO } from '@/types';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WizardProps {
  onComplete: (negocioId: string) => void;
  onCancel: () => void;
}

const WizardCrearNegocio: React.FC<WizardProps> = ({ onComplete, onCancel }) => {
  const { crearNegocio } = useNegocio();
  const [paso, setPaso] = useState(1);
  const [creando, setCreando] = useState(false);
  
  // Paso 1: Información de Contacto
  const [contacto, setContacto] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cargo: ''
  });

  // Paso 2: Información de Empresa
  const [tipoCliente, setTipoCliente] = useState<'productora' | 'cliente_final'>('cliente_final');
  const [productora, setProductora] = useState({
    nombre: '',
    rut: '',
    sitioWeb: '',
    direccion: ''
  });
  const [tieneClienteFinal, setTieneClienteFinal] = useState(false);
  const [clienteFinal, setClienteFinal] = useState({
    nombre: '',
    rut: '',
    sitioWeb: '',
    direccion: ''
  });

  // Paso 3: Información del Evento
  const [evento, setEvento] = useState({
    tipoEvento: '',
    nombreEvento: '',
    fechaEvento: '',
    horasAcreditacion: '',
    cantidadAsistentes: 0,
    cantidadInvitados: 0,
    locacion: ''
  });

  const validarPaso1 = () => {
    return contacto.nombre && contacto.apellido && contacto.email && contacto.telefono;
  };

  const validarPaso2 = () => {
    if (tipoCliente === 'productora') {
      const productoraValida = productora.nombre;
      if (tieneClienteFinal) {
        return productoraValida && clienteFinal.nombre;
      }
      return productoraValida;
    } else {
      return clienteFinal.nombre;
    }
  };

  const validarPaso3 = () => {
    return evento.tipoEvento && evento.nombreEvento && evento.fechaEvento && 
           evento.horasAcreditacion && evento.locacion;
  };

  const siguientePaso = () => {
    if (paso === 1 && !validarPaso1()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    if (paso === 2 && !validarPaso2()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    setPaso(paso + 1);
  };

  const anteriorPaso = () => {
    setPaso(paso - 1);
  };

  const finalizarWizard = async () => {
    if (!validarPaso3()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setCreando(true);
    try {
      const negocioData = {
        contacto: {
          id: `contacto-${Date.now()}`,
          ...contacto
        },
        productora: tipoCliente === 'productora' ? {
          id: `productora-${Date.now()}`,
          ...productora,
          tipo: 'productora' as const
        } : undefined,
        clienteFinal: (tipoCliente === 'cliente_final' || tieneClienteFinal) ? {
          id: `cliente-${Date.now()}`,
          ...clienteFinal,
          tipo: 'cliente_final' as const
        } : undefined,
        evento
      };

      const negocioId = await crearNegocio(negocioData);
      
      toast({
        title: "Negocio creado exitosamente",
        description: "El negocio ha sido creado. Ahora puede agregar presupuestos.",
      });

      onComplete(negocioId);
    } catch (error) {
      console.error('Error creando negocio:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el negocio. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear Nuevo Negocio</h2>
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                num === paso ? 'bg-blue-600 text-white' :
                num < paso ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {num < paso ? <CheckCircle className="w-4 h-4" /> : num}
              </div>
              {num < 3 && <div className="w-16 h-0.5 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Paso {paso} de 3: {
            paso === 1 ? 'Información de Contacto' :
            paso === 2 ? 'Información de Empresa' :
            'Información del Evento'
          }
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {paso === 1 && 'Información de Contacto'}
            {paso === 2 && 'Información de Empresa'}
            {paso === 3 && 'Información del Evento'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {paso === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={contacto.nombre}
                  onChange={(e) => setContacto({...contacto, nombre: e.target.value})}
                  placeholder="Ingrese el nombre"
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={contacto.apellido}
                  onChange={(e) => setContacto({...contacto, apellido: e.target.value})}
                  placeholder="Ingrese el apellido"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={contacto.email}
                  onChange={(e) => setContacto({...contacto, email: e.target.value})}
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={contacto.telefono}
                  onChange={(e) => setContacto({...contacto, telefono: e.target.value})}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="cargo">Cargo (opcional)</Label>
                <Input
                  id="cargo"
                  value={contacto.cargo}
                  onChange={(e) => setContacto({...contacto, cargo: e.target.value})}
                  placeholder="Ej: Gerente de Marketing"
                />
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-6">
              <div>
                <Label>¿Este negocio es para una productora o cliente final?</Label>
                <Select value={tipoCliente} onValueChange={(value: 'productora' | 'cliente_final') => setTipoCliente(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente_final">Cliente Final</SelectItem>
                    <SelectItem value="productora">Productora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipoCliente === 'productora' && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium mb-4">Información de la Productora</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="productoraFirma">Nombre de la Productora *</Label>
                      <Input
                        id="productoraFirma"
                        value={productora.nombre}
                        onChange={(e) => setProductora({...productora, nombre: e.target.value})}
                        placeholder="Nombre de la productora"
                      />
                    </div>
                    <div>
                      <Label htmlFor="productoraRut">RUT (opcional)</Label>
                      <Input
                        id="productoraRut"
                        value={productora.rut}
                        onChange={(e) => setProductora({...productora, rut: e.target.value})}
                        placeholder="12.345.678-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="productoraWeb">Sitio Web (opcional)</Label>
                      <Input
                        id="productoraWeb"
                        value={productora.sitioWeb}
                        onChange={(e) => setProductora({...productora, sitioWeb: e.target.value})}
                        placeholder="www.productora.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="productoraDir">Dirección (opcional)</Label>
                      <Input
                        id="productoraDir"
                        value={productora.direccion}
                        onChange={(e) => setProductora({...productora, direccion: e.target.value})}
                        placeholder="Dirección de la productora"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tieneClienteFinal"
                        checked={tieneClienteFinal}
                        onCheckedChange={(checked) => setTieneClienteFinal(checked as boolean)}
                      />
                      <Label htmlFor="tieneClienteFinal">¿Conoce el cliente final?</Label>
                    </div>
                  </div>
                </div>
              )}

              {(tipoCliente === 'cliente_final' || tieneClienteFinal) && (
                <div className="border rounded-lg p-4 bg-green-50">
                  <h4 className="font-medium mb-4">Información del Cliente Final</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="clienteNombre">Nombre del Cliente Final *</Label>
                      <Input
                        id="clienteNombre"
                        value={clienteFinal.nombre}
                        onChange={(e) => setClienteFinal({...clienteFinal, nombre: e.target.value})}
                        placeholder="Nombre del cliente final"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clienteRut">RUT (opcional)</Label>
                      <Input
                        id="clienteRut"
                        value={clienteFinal.rut}
                        onChange={(e) => setClienteFinal({...clienteFinal, rut: e.target.value})}
                        placeholder="12.345.678-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clienteWeb">Sitio Web (opcional)</Label>
                      <Input
                        id="clienteWeb"
                        value={clienteFinal.sitioWeb}
                        onChange={(e) => setClienteFinal({...clienteFinal, sitioWeb: e.target.value})}
                        placeholder="www.cliente.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="clienteDir">Dirección (opcional)</Label>
                      <Input
                        id="clienteDir"
                        value={clienteFinal.direccion}
                        onChange={(e) => setClienteFinal({...clienteFinal, direccion: e.target.value})}
                        placeholder="Dirección del cliente"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {paso === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoEvento">Tipo de Evento *</Label>
                <Select value={evento.tipoEvento} onValueChange={(value) => setEvento({...evento, tipoEvento: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nombreEvento">Nombre del Evento *</Label>
                <Input
                  id="nombreEvento"
                  value={evento.nombreEvento}
                  onChange={(e) => setEvento({...evento, nombreEvento: e.target.value})}
                  placeholder="Nombre del evento"
                />
              </div>
              <div>
                <Label htmlFor="fechaEvento">Fecha del Evento *</Label>
                <Input
                  id="fechaEvento"
                  type="date"
                  value={evento.fechaEvento}
                  onChange={(e) => setEvento({...evento, fechaEvento: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="horasAcreditacion">Horas de Acreditación *</Label>
                <Input
                  id="horasAcreditacion"
                  value={evento.horasAcreditacion}
                  onChange={(e) => setEvento({...evento, horasAcreditacion: e.target.value})}
                  placeholder="Ej: 08:00 - 18:00"
                />
              </div>
              <div>
                <Label htmlFor="cantidadAsistentes">Cantidad de Asistentes Esperados</Label>
                <Input
                  id="cantidadAsistentes"
                  type="number"
                  value={evento.cantidadAsistentes}
                  onChange={(e) => setEvento({...evento, cantidadAsistentes: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="cantidadInvitados">Cantidad de Invitados</Label>
                <Input
                  id="cantidadInvitados"
                  type="number"
                  value={evento.cantidadInvitados}
                  onChange={(e) => setEvento({...evento, cantidadInvitados: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="locacion">Locación del Evento *</Label>
                <Input
                  id="locacion"
                  value={evento.locacion}
                  onChange={(e) => setEvento({...evento, locacion: e.target.value})}
                  placeholder="Dirección o nombre del lugar"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <div>
          {paso > 1 && (
            <Button variant="outline" onClick={anteriorPaso} disabled={creando}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
          )}
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={creando}>
            Cancelar
          </Button>
          {paso < 3 ? (
            <Button onClick={siguientePaso} disabled={creando}>
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={finalizarWizard} className="bg-green-600 hover:bg-green-700" disabled={creando}>
              {creando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Crear Negocio
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WizardCrearNegocio;
