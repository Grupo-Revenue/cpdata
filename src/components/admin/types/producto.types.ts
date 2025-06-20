
export interface LineaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  categoria?: string;
  activo: boolean;
  created_at: string;
  linea_producto_id?: string;
  linea_producto?: LineaProducto;
}

export interface ProductFormData {
  nombre: string;
  descripcion: string;
  precio_base: string;
  linea_producto_id: string;
}
