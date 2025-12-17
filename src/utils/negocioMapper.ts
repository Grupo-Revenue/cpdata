
import { Database } from "@/integrations/supabase/types";
import { ExtendedNegocio, ExtendedPresupuesto, Evento } from "@/types";

type DatabaseNegocio = Database['public']['Tables']['negocios']['Row'];
type DatabasePresupuesto = Database['public']['Tables']['presupuestos']['Row'];

export const mapDatabaseToExtendedNegocio = (
  negocio: DatabaseNegocio & {
    contacto: any;
    productora: any;
    clienteFinal: any;
    presupuestos: any[];
  }
): ExtendedNegocio => {
  // Map database fields to legacy evento structure
  const evento: Evento = {
    tipoEvento: negocio.tipo_evento,
    nombreEvento: negocio.nombre_evento,
    fechaEvento: negocio.fecha_evento,
    fechaEventoFin: (negocio as any).fecha_evento_fin || null,
    horasAcreditacion: negocio.horas_acreditacion,
    cantidadAsistentes: negocio.cantidad_asistentes || 0,
    cantidadInvitados: negocio.cantidad_invitados || 0,
    locacion: negocio.locacion
  };

  // Map presupuestos to extended format
  const presupuestosExtended: ExtendedPresupuesto[] = negocio.presupuestos.map((presupuesto: DatabasePresupuesto) => ({
    ...presupuesto,
    fechaCreacion: presupuesto.created_at,
    fechaEnvio: presupuesto.fecha_envio || undefined,
    fechaAprobacion: presupuesto.fecha_aprobacion || undefined,
    fechaRechazo: presupuesto.fecha_rechazo || undefined,
    fechaVencimiento: presupuesto.fecha_vencimiento || undefined,
    productos: [] // Will be populated separately if needed
  }));

  return {
    ...negocio,
    evento,
    fechaCreacion: negocio.created_at,
    fechaCierre: negocio.fecha_cierre || undefined,
    contacto: negocio.contacto,
    productora: negocio.productora,
    clienteFinal: negocio.clienteFinal,
    presupuestos: presupuestosExtended
  };
};

export const mapExtendedToDatabase = (negocio: Partial<ExtendedNegocio>) => {
  const { evento, fechaCreacion, fechaCierre, presupuestos, ...rest } = negocio;
  
  return {
    ...rest,
    tipo_evento: evento?.tipoEvento,
    nombre_evento: evento?.nombreEvento,
    fecha_evento: evento?.fechaEvento,
    horas_acreditacion: evento?.horasAcreditacion,
    cantidad_asistentes: evento?.cantidadAsistentes,
    cantidad_invitados: evento?.cantidadInvitados,
    locacion: evento?.locacion,
    fecha_cierre: fechaCierre,
    created_at: fechaCreacion
  };
};

// Helper function to map ProductoPresupuesto with legacy property names
export const mapProductoPresupuestoToExtended = (producto: Database['public']['Tables']['productos_presupuesto']['Row']) => {
  return {
    ...producto,
    precioUnitario: producto.precio_unitario,
    comentarios: '',
    descuentoPorcentaje: 0
  };
};
