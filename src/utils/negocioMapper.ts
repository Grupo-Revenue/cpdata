
import { Database } from "@/integrations/supabase/types";
import { ExtendedNegocio, Evento } from "@/types";

type DatabaseNegocio = Database['public']['Tables']['negocios']['Row'];

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
    horasAcreditacion: negocio.horas_acreditacion,
    cantidadAsistentes: negocio.cantidad_asistentes || 0,
    cantidadInvitados: negocio.cantidad_invitados || 0,
    locacion: negocio.locacion
  };

  return {
    ...negocio,
    evento,
    fechaCreacion: negocio.created_at,
    fechaCierre: negocio.fecha_cierre || undefined,
    contacto: negocio.contacto,
    productora: negocio.productora,
    clienteFinal: negocio.clienteFinal,
    presupuestos: negocio.presupuestos
  };
};

export const mapExtendedToDatabase = (negocio: Partial<ExtendedNegocio>) => {
  const { evento, fechaCreacion, fechaCierre, ...rest } = negocio;
  
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
