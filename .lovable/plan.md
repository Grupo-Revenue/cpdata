# Problema

En el presupuesto, el producto "Control de Acceso" tiene 2 sesiones de acreditación guardadas (se ven correctamente en el PDF), pero al **Editar** no aparece el bloque "Detalle de Sesiones de Acreditación" para poder modificarlas.

# Causa

En `ProductExpandedDetails.tsx`, la detección de producto de acreditación es:

```text
linea_producto_id === ACREDITACION  OR
nombre incluye "acreditación"  OR
descripcion incluye "acreditación"
```

- La tabla `productos_presupuesto` **no tiene** la columna `linea_producto_id` (verificado en BD), así que ese check siempre da falso al editar.
- El producto se llama "Control de Acceso" y su descripción tampoco contiene la palabra "acreditación".
- Resultado: `isAccreditationProduct = false` → no se renderiza `<AccreditationSessionsManager>`, aunque el producto sí tenga `sessions` cargadas.

El PDF funciona porque renderiza las sesiones sin chequear el flag, solo mira `producto.sessions.length > 0`.

# Solución

Agregar una condición extra: también tratar el producto como de acreditación cuando **ya tiene `sessions` guardadas** (array con al menos 1 elemento). Así cualquier producto que tenga sesiones persistidas (como "Control de Acceso") muestra el editor de sesiones en Editar.

## Cambio

**`src/components/presupuesto/components/ProductExpandedDetails.tsx`** (líneas 69-73):

```text
const isAccreditationProduct =
  producto.linea_producto_id === ACREDITACION_LINEA_PRODUCTO_ID ||
  producto.nombre.toLowerCase().includes('acreditación') ||
  producto.descripcion?.toLowerCase().includes('acreditación') ||
  (Array.isArray(producto.sessions) && producto.sessions.length > 0); // NUEVO
```

No se toca lógica de cálculo, PDF, ni la creación de productos nuevos desde la biblioteca (esos siguen detectándose por `linea_producto_id`/nombre como hoy).

# Fuera de alcance

- Agregar columna `linea_producto_id` a `productos_presupuesto` (cambio mayor de schema/migraciones).
- Cambios en cálculo de totales, precio manual, o en el PDF.
- Cambios en el clonado de presupuestos.
