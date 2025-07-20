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

export const calcularTotalesPresupuesto = (productos: ProductoPresupuesto[]): QuoteTotals => {
  const subtotal = productos.reduce((sum, producto) => {
    const cantidad = producto.cantidad || 0;
    const precioUnitario = producto.precioUnitario || producto.precio_unitario || 0;
    return sum + (cantidad * precioUnitario);
  }, 0);

  const totalDescuentos = productos.reduce((sum, producto) => {
    const cantidad = producto.cantidad || 0;
    const precioUnitario = producto.precioUnitario || producto.precio_unitario || 0;
    const descuentoPorcentaje = producto.descuentoPorcentaje || 0;
    const subtotalProducto = cantidad * precioUnitario;
    const descuento = subtotalProducto * (descuentoPorcentaje / 100);
    return sum + descuento;
  }, 0);

  const subtotalConDescuento = subtotal - totalDescuentos;
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
