

import { Database } from "@/integrations/supabase/types";

export type Contacto = Database['public']['Tables']['contactos']['Row']
export type Empresa = Database['public']['Tables']['empresas']['Row']
export type Negocio = ExtendedNegocio
export type Presupuesto = ExtendedPresupuesto
export type ProductoPresupuesto = ExtendedProductoPresupuesto
export type ProductoBiblioteca = Database['public']['Tables']['productos_biblioteca']['Row']
export type LineaProducto = Database['public']['Tables']['lineas_producto']['Row']
export type ConfiguracionMarca = Database['public']['Tables']['configuracion_marca']['Row']

// Constants
export const IVA_PERCENTAGE = 19;

// Extended types for application use
export type ExtendedProductoPresupuesto = Database['public']['Tables']['productos_presupuesto']['Row'] & {
  comentarios?: string;
  descuentoPorcentaje?: number;
  precioUnitario?: number; // Legacy property name mapping
  precio_unitario: number;
}

export type ExtendedNegocio = Database['public']['Tables']['negocios']['Row'] & {
  contacto: Contacto;
  productora: Empresa | null;
  clienteFinal: Empresa | null;
  presupuestos: ExtendedPresupuesto[];
  // Legacy properties for backwards compatibility
  evento: Evento;
  fechaCreacion: string;
  fechaCierre?: string;
}

export type ExtendedPresupuesto = Database['public']['Tables']['presupuestos']['Row'] & {
  productos?: ExtendedProductoPresupuesto[];
  fechaCreacion: string;
  fechaEnvio?: string;
  fechaAprobacion?: string;
  fechaRechazo?: string;
  // Legacy property name for backwards compatibility
  fechaVencimiento?: string;
}

export type Evento = {
  tipoEvento: string;
  nombreEvento: string;
  fechaEvento: string | null;
  horasAcreditacion: string;
  cantidadAsistentes: number;
  cantidadInvitados: number;
  locacion: string;
}

// Update EstadoNegocio to match database enum exactly
export type EstadoNegocio = Database['public']['Enums']['estado_negocio'];

export type EstadoPresupuesto = Database['public']['Enums']['estado_presupuesto'];

export type TipoEmpresa = Database['public']['Enums']['tipo_empresa'];

// Event types constant that was missing
export const TIPOS_EVENTO = [
  'Congreso',
  'Seminario',
  'Workshop',
  'Conferencia',
  'Feria Comercial',
  'Lanzamiento de Producto',
  'Evento Corporativo',
  'Capacitación',
  'Evento Deportivo',
  'Evento Cultural',
  'Evento Benéfico',
  'Networking',
  'Otro'
] as const;

// Create a simplified type for business creation that matches what WizardCrearNegocio provides
export type CrearNegocioData = {
  contacto: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    cargo?: string;
  };
  productora?: {
    nombre: string;
    rut?: string;
    sitio_web?: string;
    direccion?: string;
    tipo: 'productora';
  };
  clienteFinal?: {
    nombre: string;
    rut?: string;
    sitio_web?: string;
    direccion?: string;
    tipo: 'cliente_final';
  };
  tipo_evento: string;
  nombre_evento: string;
  fecha_evento: string;
  horas_acreditacion: string;
  cantidad_asistentes: number;
  cantidad_invitados: number;
  locacion: string;
  fecha_cierre?: string;
};

