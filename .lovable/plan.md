## Problema

En el PDF, cuando un producto tiene jornadas de acreditación:
- **PRECIO UNIT.**: $390.000 ❌ (precio base del producto)
- **TOTAL**: $2.175.000 ✅ (suma de jornadas)

Inconsistencia: `1 × $390.000 ≠ $2.175.000`.

## Solución

En `src/components/pdf/components/PDFProductTable.tsx`, hacer que la celda **PRECIO UNIT.** use el mismo `displayTotal` dividido por la cantidad cuando el producto tenga jornadas. Subir el cálculo a nivel de fila para reutilizarlo en ambas celdas.

```tsx
const sessionsTotal = (producto.sessions || []).reduce(
  (sum, x) => sum + (Number(x.monto) || Number(x.precio) || 0), 0
);
const hasSessions = producto.sessions?.length > 0 && sessionsTotal > 0;
const displayTotal = hasSessions ? sessionsTotal : Number(producto.total) || 0;
const cantidad = Number(producto.cantidad) || 1;
const displayUnitPrice = hasSessions
  ? displayTotal / cantidad
  : (producto.precioUnitario || producto.precio_unitario);
```

- **PRECIO UNIT.** → `formatearPrecio(displayUnitPrice)` → mostrará `$2.175.000`
- **TOTAL** → `formatearPrecio(displayTotal)` → sin cambios

Resultado: `1 × $2.175.000 = $2.175.000` ✅

Cambio aislado al PDF; no toca cálculos de totales, IVA, ni persistencia.
