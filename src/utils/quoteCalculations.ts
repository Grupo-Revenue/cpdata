import { ProductoPresupuesto, IVA_PERCENTAGE } from '@/types';

export interface QuoteTotals {
  subtotal: number;
  totalDescuentos: number;
  subtotalConDescuento: number;
  iva: number;
  total: number;
}

export const calcularTotalProducto = (cantidad: number, precioUnitario: number, descuentoPorcentaje: number = 0): number => {
  const subtotalProducto = cantidad * precioUnitario;
  const descuento = subtotalProducto * ((descuentoPorcentaje || 0) / 100);
  return subtotalProducto - descuento;
};

// Calculate equivalent discount info when a manual final price is applied
export const calcularDescuentoEquivalente = (
  precioLista: number,
  cantidad: number,
  precioManual: number
): { porcentaje: number; monto: number } => {
  const subtotalLista = (Number(precioLista) || 0) * (Number(cantidad) || 0);
  const manual = Number(precioManual) || 0;
  const monto = Math.max(0, subtotalLista - manual);
  const porcentaje = subtotalLista > 0 ? (monto / subtotalLista) * 100 : 0;
  return { porcentaje, monto };
};

// Resolve the effective net subtotal for a single product line, honoring manual override.
const getEffectiveLineSubtotal = (producto: any): { effective: number; listaSubtotal: number } => {
  const cantidad = Number(producto.cantidad) || 0;
  const precioUnitario = Number(producto.precioUnitario || producto.precio_unitario) || 0;
  const descuentoPorcentaje = Number(producto.descuentoPorcentaje || producto.descuento_porcentaje) || 0;

  const manualRaw = producto.precioFinalManual ?? producto.precio_final_manual;
  const hasManual = manualRaw !== null && manualRaw !== undefined && manualRaw !== '' && !Number.isNaN(Number(manualRaw));

  const sessions = producto.sessions;
  const sessionsTotal = Array.isArray(sessions)
    ? sessions.reduce((s: number, x: any) => s + (Number(x?.monto) || 0), 0)
    : 0;
  const hasSessions = Array.isArray(sessions) && sessions.length > 0 && sessionsTotal > 0;

  const listaSubtotal = hasSessions ? sessionsTotal : cantidad * precioUnitario;

  if (hasManual) {
    return { effective: Math.max(0, Number(manualRaw)), listaSubtotal };
  }

  const baseForDiscount = hasSessions ? sessionsTotal : cantidad * precioUnitario;
  const descuento = baseForDiscount * (descuentoPorcentaje / 100);
  return { effective: baseForDiscount - descuento, listaSubtotal };
};

export const calcularTotalesPresupuesto = (productos: ProductoPresupuesto[]): QuoteTotals => {
  let subtotal = 0;
  let subtotalConDescuento = 0;
  for (const producto of productos) {
    const { effective, listaSubtotal } = getEffectiveLineSubtotal(producto as any);
    subtotal += listaSubtotal;
    subtotalConDescuento += effective;
  }
  const totalDescuentos = Math.max(0, subtotal - subtotalConDescuento);
  const iva = subtotalConDescuento * (IVA_PERCENTAGE / 100);
  const total = subtotalConDescuento + iva;

  return {
    subtotal,
    totalDescuentos,
    subtotalConDescuento,
    iva,
    total
  };
};

// Export IVA_PERCENTAGE for use in templates
export { IVA_PERCENTAGE };

// Centralized quote status color functions
export const getQuoteStatusColors = (estado: string): string => {
  const colores = {
    borrador: 'bg-slate-100 text-slate-700 border-slate-200',
    publicado: 'bg-blue-100 text-blue-700 border-blue-200',
    aprobado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rechazado: 'bg-red-100 text-red-700 border-red-200',
    vencido: 'bg-orange-100 text-orange-700 border-orange-200',
    cancelado: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  return colores[estado as keyof typeof colores] || 'bg-slate-100 text-slate-700 border-slate-200';
};

export const getQuoteStatusBadgeVariant = (estado: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (estado) {
    case 'aprobado':
      return 'default'; // Verde
    case 'publicado':
      return 'secondary'; // Azul
    case 'rechazado':
      return 'destructive'; // Rojo
    case 'borrador':
    case 'vencido':
    case 'cancelado':
    default:
      return 'outline'; // Gris
  }
};

export const getQuoteStatusText = (estado: string): string => {
  switch (estado) {
    case 'borrador':
      return 'Borrador';
    case 'publicado':
      return 'Publicado';
    case 'aprobado':
      return 'Aprobado';
    case 'rechazado':
      return 'Rechazado';
    case 'vencido':
      return 'Vencido';
    case 'cancelado':
      return 'Cancelado';
    default:
      return estado;
  }
};
