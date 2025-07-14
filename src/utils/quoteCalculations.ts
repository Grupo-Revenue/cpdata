

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

