export interface Contacto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo?: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  rut?: string;
  sitioWeb?: string;
  direccion?: string;
  tipo: 'productora' | 'cliente_final';
}

export interface Evento {
  tipoEvento: string;
  nombreEvento: string;
  fechaEvento: string;
  horasAcreditacion: string;
  cantidadAsistentes: number;
  cantidadInvitados: number;
  locacion: string;
}

export interface ProductoPresupuesto {
  id: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface Presupuesto {
  id: string;
  nombre: string; // Ej: 17658A
  productos: ProductoPresupuesto[];
  total: number;
  fechaCreacion: string;
  estado: 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'vencido' | 'cancelado';
  fechaVencimiento?: string;
  fechaEnvio?: string;
  fechaAprobacion?: string;
  fechaRechazo?: string;
}

export interface Negocio {
  id: string;
  numero: number; // Numero correlativo
  contacto: Contacto;
  productora?: Empresa;
  clienteFinal?: Empresa;
  evento: Evento;
  presupuestos: Presupuesto[];
  fechaCreacion: string;
  estado: 'activo' | 'cerrado' | 'cancelado' | 'prospecto' | 'perdido' | 'ganado' | 'revision_pendiente' | 'en_negociacion' | 'parcialmente_ganado';
}

export interface ProductoBiblioteca {
  id: string;
  nombre: string;
  descripcion: string;
  precioBase: number;
  categoria: string;
}

export const TIPOS_EVENTO = [
  'Conferencia',
  'Seminario',
  'Workshop',
  'Congreso',
  'Feria Comercial',
  'Lanzamiento de Producto',
  'Evento Corporativo',
  'Capacitación',
  'Otros'
];

export const PRODUCTOS_BIBLIOTECA: ProductoBiblioteca[] = [
  {
    id: '1',
    nombre: 'Acreditación Digital',
    descripcion: 'Sistema de acreditación digital con QR',
    precioBase: 15000,
    categoria: 'Acreditación'
  },
  {
    id: '2',
    nombre: 'Acreditación Presencial',
    descripcion: 'Stand de acreditación con personal',
    precioBase: 25000,
    categoria: 'Acreditación'
  },
  {
    id: '3',
    nombre: 'Confirmación por Email',
    descripcion: 'Sistema automatizado de confirmación',
    precioBase: 8000,
    categoria: 'Confirmación'
  },
  {
    id: '4',
    nombre: 'Confirmación Telefónica',
    descripcion: 'Llamadas de confirmación personalizadas',
    precioBase: 12000,
    categoria: 'Confirmación'
  },
  {
    id: '5',
    nombre: 'Base de Datos Personalizada',
    descripcion: 'Desarrollo de BD específica para el evento',
    precioBase: 45000,
    categoria: 'Desarrollo'
  },
  {
    id: '6',
    nombre: 'Reportes en Tiempo Real',
    descripcion: 'Dashboard con métricas en vivo',
    precioBase: 35000,
    categoria: 'Reportes'
  }
];
