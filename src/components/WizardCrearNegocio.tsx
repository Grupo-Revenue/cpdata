import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useNegocio } from '@/context/NegocioContext';
import { TIPOS_EVENTO, CrearNegocioData } from '@/types';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, AlertCircle, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useChileanPhoneValidator } from '@/hooks/useChileanPhoneValidator';
import { useEmailValidator } from '@/hooks/useEmailValidator';
import { useChileanRutValidator } from '@/hooks/useChileanRutValidator';
import { useHubSpotContactValidation } from '@/hooks/useHubSpotContactValidation';

interface WizardProps {
  onComplete: (negocioId: string) => void;
  onCancel: () => void;
}

const WizardCrearNegocio: React.FC<WizardProps> = ({ onComplete, onCancel }) => {
  const { crearNegocio } = useNegocio();
  const [paso, setPaso] = useState(1);
  const [creando, setCreando] = useState(false);
  
  // Validadores
  const phoneValidator = useChileanPhoneValidator('+56');
  const emailValidator = useEmailValidator();
  const rutValidator = useChileanRutValidator();
  const rutProductoraValidator = useChileanRutValidator();
  
  // HubSpot validation hook
  const {
    validateEmail,
    createContactInHubSpot,
    clearValidation,
    isValidating,
    validationMessage,
    isContactFound
  } = useHubSpotContactValidation();
  
  // Paso 1: Información de Contacto
  const [contacto, setContacto] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '+56',
    cargo: ''
  });

  // Paso 2: Información de Empresa
  const [tipoCliente, setTipoCliente] = useState<'productora' | 'cliente_final'>('cliente_final');
  const [productora, setProductora] = useState({
    nombre: '',
    rut: '',
    sitio_web: '',
    direccion: ''
  });
  const [tieneClienteFinal, setTieneClienteFinal] = useState(false);
  const [clienteFinal, setClienteFinal] = useState({
    nombre: '',
    rut: '',
    sitio_web: '',
    direccion: ''
  });

  // Paso 3: Información del Evento
  const [evento, setEvento] = useState({
    tipo_evento: '',
    nombre_evento: '',
    fecha_evento: '',
    fecha_evento_fin: '',
    horario_inicio: '',
    horario_fin: '',
    cantidad_asistentes: '',
    cantidad_invitados: '',
    locacion: ''
  });

  // New field for close date
  const [fechaCierre, setFechaCierre] = useState('');

  // Handle manual email validation
  const handleManualEmailValidation = async () => {
    if (!contacto.email || !emailValidator.isValid) {
      toast({
        title: "Email inválido",
        description: "Por favor ingrese un email válido antes de validar.",
        variant: "destructive"
      });
      return;
    }

    const result = await validateEmail(contacto.email);
    
    if (result && result.found && result.contact) {
      // Auto-fill contact information
      setContacto(prev => ({
        ...prev,
        nombre: result.contact!.firstname || prev.nombre,
        apellido: result.contact!.lastname || prev.apellido,
        telefono: result.contact!.phone || prev.telefono
      }));
    }
  };

  // Handle email change with debounced validation
  useEffect(() => {
    if (contacto.email && emailValidator.isValid) {
      const timeoutId = setTimeout(() => {
        validateEmail(contacto.email).then(result => {
          if (result && result.found && result.contact) {
            setContacto(prev => ({
              ...prev,
              nombre: result.contact!.firstname || prev.nombre,
              apellido: result.contact!.lastname || prev.apellido,
              telefono: result.contact!.phone || prev.telefono
            }));
          }
        });
      }, 1000); // 1 second delay

      return () => clearTimeout(timeoutId);
    } else {
      clearValidation();
    }
  }, [contacto.email, emailValidator.isValid]);

  const validarPaso1 = () => {
    return contacto.nombre && contacto.apellido && emailValidator.isValid && phoneValidator.isValid;
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
    return evento.tipo_evento && evento.nombre_evento && evento.fecha_evento && evento.locacion;
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
      // If contact was not found in HubSpot, create it
      if (isContactFound === false) {
        await createContactInHubSpot(contacto);
      }

      // Create the data object with the proper structure expected by the crearNegocio function
      const negocioData = {
        contacto,
        productora: tipoCliente === 'productora' ? {
          ...productora,
          tipo: 'productora' as const
        } : undefined,
        clienteFinal: (tipoCliente === 'cliente_final' || tieneClienteFinal) ? {
          ...clienteFinal,
          tipo: 'cliente_final' as const
        } : undefined,
        // Event data should be passed as individual fields, not nested
        tipo_evento: evento.tipo_evento,
        nombre_evento: evento.nombre_evento,
        fecha_evento: evento.fecha_evento,
        horas_acreditacion: evento.horario_inicio && evento.horario_fin 
          ? `${evento.horario_inicio} - ${evento.horario_fin}` 
          : '00:00 - 00:00',
        cantidad_asistentes: parseInt(evento.cantidad_asistentes) || 0,
        cantidad_invitados: parseInt(evento.cantidad_invitados) || 0,
        locacion: evento.locacion,
        fecha_cierre: fechaCierre || undefined
      };

      const negocioCreado = await crearNegocio(negocioData);
      
      if (negocioCreado) {
        toast({
          title: "Negocio creado exitosamente",
          description: "El negocio ha sido creado. Ahora puede agregar presupuestos.",
        });

        onComplete(negocioCreado.id);
      } else {
        throw new Error('No se pudo crear el negocio');
      }
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
              <div className="md:col-span-2">
                <Label htmlFor="email">Email *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="email"
                      type="email"
                      value={emailValidator.value}
                      onChange={(e) => {
                        const result = emailValidator.handleChange(e.target.value);
                        setContacto({...contacto, email: e.target.value});
                      }}
                      placeholder="contacto@empresa.com"
                      className={emailValidator.error ? 'border-destructive' : ''}
                    />
                    {isValidating && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Search className="w-4 h-4 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleManualEmailValidation}
                    disabled={isValidating || !emailValidator.isValid}
                    className="px-3"
                  >
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {emailValidator.error && (
                  <p className="text-sm text-destructive mt-1">{emailValidator.error}</p>
                )}
                {validationMessage && (
                  <div className={`flex items-start space-x-2 p-3 rounded-md mt-2 ${
                    isContactFound 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    {isContactFound ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={`text-sm ${
                      isContactFound ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {validationMessage}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={phoneValidator.value}
                  onChange={(e) => {
                    const result = phoneValidator.handleChange(e.target.value);
                    setContacto({...contacto, telefono: result.formattedValue});
                  }}
                  placeholder="+56 9 1234 5678"
                  className={phoneValidator.error ? 'border-destructive' : ''}
                />
                {phoneValidator.error && (
                  <p className="text-sm text-destructive mt-1">{phoneValidator.error}</p>
                )}
              </div>
              <div>
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
                        value={rutProductoraValidator.value}
                        onChange={(e) => {
                          const result = rutProductoraValidator.handleChange(e.target.value);
                          setProductora({...productora, rut: result.formattedValue});
                        }}
                        placeholder="12.345.678-9"
                        className={rutProductoraValidator.error ? 'border-destructive' : ''}
                      />
                      {rutProductoraValidator.error && (
                        <p className="text-sm text-destructive mt-1">{rutProductoraValidator.error}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="productoraWeb">Sitio Web (opcional)</Label>
                      <Input
                        id="productoraWeb"
                        value={productora.sitio_web}
                        onChange={(e) => setProductora({...productora, sitio_web: e.target.value})}
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
                        value={rutValidator.value}
                        onChange={(e) => {
                          const result = rutValidator.handleChange(e.target.value);
                          setClienteFinal({...clienteFinal, rut: result.formattedValue});
                        }}
                        placeholder="12.345.678-9"
                        className={rutValidator.error ? 'border-destructive' : ''}
                      />
                      {rutValidator.error && (
                        <p className="text-sm text-destructive mt-1">{rutValidator.error}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="clienteWeb">Sitio Web (opcional)</Label>
                      <Input
                        id="clienteWeb"
                        value={clienteFinal.sitio_web}
                        onChange={(e) => setClienteFinal({...clienteFinal, sitio_web: e.target.value})}
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
                <Select value={evento.tipo_evento} onValueChange={(value) => setEvento({...evento, tipo_evento: value})}>
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
                  value={evento.nombre_evento}
                  onChange={(e) => setEvento({...evento, nombre_evento: e.target.value})}
                  placeholder="Nombre del evento"
                />
              </div>
              <div>
                <Label htmlFor="fechaEvento">Fecha del Evento *</Label>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      id="fechaEvento"
                      type="date"
                      value={evento.fecha_evento}
                      onChange={(e) => setEvento({...evento, fecha_evento: e.target.value})}
                      placeholder="Fecha inicio"
                    />
                    <span className="text-muted-foreground text-sm">hasta</span>
                    <Input
                      id="fechaEventoFin"
                      type="date"
                      value={evento.fecha_evento_fin}
                      onChange={(e) => setEvento({...evento, fecha_evento_fin: e.target.value})}
                      placeholder="Fecha fin (opcional)"
                      min={evento.fecha_evento}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deja la segunda fecha vacía para eventos de un solo día
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="horarioEvento">Horario del Evento</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="horarioInicio"
                    type="time"
                    value={evento.horario_inicio}
                    onChange={(e) => setEvento({...evento, horario_inicio: e.target.value})}
                    placeholder="Hora inicio"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    id="horarioFin"
                    type="time"
                    value={evento.horario_fin}
                    onChange={(e) => setEvento({...evento, horario_fin: e.target.value})}
                    placeholder="Hora fin"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cantidadAsistentes">Cantidad de Asistentes Esperados</Label>
                <Input
                  id="cantidadAsistentes"
                  type="number"
                  value={evento.cantidad_asistentes}
                  onChange={(e) => setEvento({...evento, cantidad_asistentes: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="cantidadInvitados">Cantidad de Invitados</Label>
                <Input
                  id="cantidadInvitados"
                  type="number"
                  value={evento.cantidad_invitados}
                  onChange={(e) => setEvento({...evento, cantidad_invitados: e.target.value})}
                  placeholder="0"
                  min="0"
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
              <div className="md:col-span-2">
                <Label htmlFor="fechaCierre">Fecha de Cierre Esperada (opcional)</Label>
                <Input
                  id="fechaCierre"
                  type="date"
                  value={fechaCierre}
                  onChange={(e) => setFechaCierre(e.target.value)}
                  placeholder="Fecha esperada de cierre del negocio"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Esta fecha se sincronizará con HubSpot como "closedate"
                </p>
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
