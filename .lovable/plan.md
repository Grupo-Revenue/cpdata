## Objetivo

Permitir fijar un **precio final manual por línea de producto** en la cotización, que tenga prioridad absoluta sobre el descuento porcentual y se refleje en subtotales, IVA, total, persistencia, PDF y sincronización con HubSpot.

## Alcance

- Solo a nivel de **línea de producto** (no total global, según el spec actualizado).
- Coexiste con el % de descuento, pero el precio manual **gana siempre** que esté presente.
- Editable mientras el presupuesto esté en estado `borrador`.
- Al borrar el valor manual, vuelve al cálculo estándar (cantidad × precio − %).

## Reglas de negocio

- Precio manual ≥ 0.
- Precio manual ≤ precio de lista × cantidad (subtotal sin descuento). Si excede, se bloquea con mensaje (sin permiso especial de admin en esta primera entrega — se puede sumar después).
- Productos con jornadas (acreditación): el precio manual también puede aplicarse y reemplaza el total de jornadas para esa línea.
- Valor ingresado es **neto** (sin IVA). El IVA se recalcula sobre el efectivo.

## Cambios en base de datos

Migración: agregar columna nullable a `productos_presupuesto`:

- `precio_final_manual numeric NULL` — monto neto que sobrescribe el cálculo de la línea.

No se modifica `presupuestos.total` ni la sincronización con HubSpot (sigue consumiendo el total efectivo recalculado).

## Cambios en código

### Tipos (`src/types/index.ts`)
Agregar `precioFinalManual?: number | null` y alias `precio_final_manual?: number | null` en `ExtendedProductoPresupuesto`.

### Lógica de cálculo (`src/utils/quoteCalculations.ts`)
Nueva prioridad por producto en `calcularTotalesPresupuesto`:
1. Si `precio_final_manual` está definido (>= 0) → usarlo como subtotal de la línea, ignorar cantidad×precio, % y jornadas.
2. Si tiene jornadas con monto → usar suma de jornadas, aplicar %.
3. Estándar: `cantidad × precioUnitario`, aplicar %.

`totalDescuentos` se reporta como diferencia entre subtotal de lista y subtotal efectivo (informativo; puede incluir el efecto del precio manual).

Nueva utilidad: `calcularDescuentoEquivalente(precioLista, cantidad, precioManual)` → retorna `{ porcentaje, monto }` para mostrar en UI.

### Hook (`src/hooks/useProductManagement.ts`)
- Manejar campo `precioFinalManual` en `actualizarProducto`.
- Al cambiar `precioFinalManual`:
  - Si tiene valor → `total` = precio manual.
  - Si se borra (null) → recalcular total con la lógica estándar (jornadas o cantidad×precio×(1-desc)).
- En `setProductosFromExternal`, mapear `precio_final_manual` desde DB.

### UI fila de producto (`src/components/presupuesto/components/ProductMainRow.tsx`)
En la celda TOTAL:
- Si **no** hay precio manual: mostrar total calculado + botón pequeño "Fijar precio".
- Si **sí** hay precio manual:
  - Input numérico editable con el valor neto.
  - Badge "Manual" + botón "✕" para limpiar.
  - Debajo, texto informativo: `Desc. equivalente: 10,26% (−$40.000)` respecto a precio lista × cantidad.

El campo `Desc. %` permanece visible pero queda **deshabilitado visualmente** mientras exista precio manual (con tooltip explicando que el precio manual tiene prioridad). Sigue almacenándose por si el usuario quita el precio manual.

### Validaciones en tiempo real
- Rechazar valores negativos.
- Si supera `cantidad × precioUnitario`, mostrar error inline ("No puede superar el precio de lista") y no aceptar el valor.

### Persistencia (`src/services/presupuestoService.ts` y `productosPresupuestoService.ts`)
Guardar/cargar `precio_final_manual` por producto. `presupuestos.total` se sigue calculando con el subtotal efectivo (manual cuando existe), de modo que la sync con HubSpot (`hubspot-deal-amount-update`) no requiere cambios.

### PDF (`src/components/pdf/components/PDFProductTable.tsx` y `PDFPricingSummary.tsx`)
Cuando hay `precio_final_manual`:
- `PRECIO UNIT.` muestra `precio_final_manual / cantidad`.
- `TOTAL` muestra `precio_final_manual`.
- No se modifican etiquetas adicionales (el cliente ve un precio limpio).

El resumen del PDF refleja el subtotal efectivo y el IVA recalculado.

### Trazabilidad / historial
No hay tabla de log de cambios de cotización actualmente. Para esta entrega:
- Persistir el valor manual con `updated_at` ya cubierto por el trigger existente.
- Dejar pendiente (no incluido) la creación de tabla `presupuesto_audit_log`; se puede abordar en un siguiente requerimiento si se quiere historial fino.

## Archivos a tocar

1. Migración SQL (nueva columna).
2. `src/types/index.ts`
3. `src/utils/quoteCalculations.ts`
4. `src/hooks/useProductManagement.ts`
5. `src/components/presupuesto/components/ProductMainRow.tsx`
6. `src/components/presupuesto/components/ProductExpandedDetails.tsx` (mostrar info de descuento equivalente si está expandido)
7. `src/services/presupuestoService.ts` / `productosPresupuestoService.ts`
8. `src/components/pdf/components/PDFProductTable.tsx`
9. `src/components/pdf/components/PDFPricingSummary.tsx`

## Fuera de alcance (para confirmar o dejar para después)

- Descuento global por monto fijo a nivel de cotización completa.
- Permiso de admin para superar el precio de lista (recargos).
- Tabla de historial/log de cambios de cotización.
