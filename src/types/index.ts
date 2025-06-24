
import { Database } from "@/integrations/supabase/types";

export type Contacto = Database['public']['Tables']['contactos']['Row']
export type Empresa = Database['public']['Tables']['empresas']['Row']
export type Negocio = ExtendedNegocio //Database['public']['Tables']['negocios']['Row']
export type Presupuesto = Database['public']['Tables']['presupuestos']['Row']
export type ProductoPresupuesto = Database['public']['Tables']['productos_presupuesto']['Row']
export type ProductoBiblioteca = Database['public']['Tables']['productos_biblioteca']['Row']
export type LineaProducto = Database['public']['Tables']['lineas_producto']['Row']
export type ConfiguracionMarca = Database['public']['Tables']['configuracion_marca']['Row']

export type ExtendedNegocio = Database['public']['Tables']['negocios']['Row'] & {
  contacto: Contacto;
  productora: Empresa | null;
  clienteFinal: Empresa | null;
  presupuestos: Presupuesto[];
  // Legacy properties for backwards compatibility
  evento: Evento;
  fechaCreacion: string;
  fechaCierre?: string;
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

export type EstadoNegocio = 
  | 'oportunidad_creada'
  | 'presupuesto_enviado' 
  | 'negocio_aceptado'
  | 'parcialmente_aceptado'
  | 'negocio_perdido'
  | 'negocio_cerrado';

export type EstadoPresupuesto = 'borrador' | 'enviado' | 'aprobado' | 'rechazado';
export type TipoEmpresa = 'productora' | 'cliente_final';

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
