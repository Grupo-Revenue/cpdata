export interface ContactoData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo: string;
}

export interface ProductoraData {
  nombre: string;
  rut: string;
  sitio_web: string;
  direccion: string;
}

export interface ClienteFinalData {
  nombre: string;
  rut: string;
  sitio_web: string;
  direccion: string;
}

export interface EventoData {
  tipo_evento: string;
  nombre_evento: string;
  fecha_evento: string;
  fecha_evento_fin: string;
  horario_inicio: string;
  horario_fin: string;
  cantidad_asistentes: string;
  cantidad_invitados: string;
  locacion: string;
}

export interface WizardState {
  paso: number;
  contacto: ContactoData;
  tipoCliente: 'productora' | 'cliente_final';
  productora: ProductoraData;
  tieneClienteFinal: boolean;
  clienteFinal: ClienteFinalData;
  evento: EventoData;
  fechaCierre: string;
}

export interface WizardProps {
  onComplete: (negocioId: string) => void;
  onCancel: () => void;
}