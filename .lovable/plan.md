## Problema

Al rechazar un presupuesto y usar "Clonar como borrador", el nuevo borrador aparece sin líneas de producto. Revisando la base de datos en el negocio 5299:

- `5299G` (borrador clonado, creado 14:15:16) tiene su único producto creado 14 minutos después → indica que el clon nació vacío y la línea se agregó a mano.
- `5299H` (borrador clonado, creado 14:23:15) tiene su producto creado 34 s después → mismo patrón.

El código actual de `clonarPresupuesto` en `src/hooks/usePresupuestoActions.ts` sí intenta copiar los productos, pero hay varios puntos frágiles que pueden hacer que la copia se pierda silenciosamente o que la UI no la muestre tras el clon.

## Causas probables

1. `select('*')` de `productos_presupuesto` puede devolver `[]` si la sesión todavía no está plenamente autenticada al momento del clic; el código entonces salta el `INSERT` sin avisar.
2. El campo `sessions` se pasa tal cual viene de Supabase (objeto JSONB). En otras partes del proyecto (`productosPresupuestoService`) se serializa con `JSON.stringify` cuando hay sesiones — la inconsistencia puede hacer que el `INSERT` falle parcialmente o quede mal formateado.
3. Tras el clon se llama `onRefresh()` pero no se navega al nuevo borrador; el `NegocioContext` puede tardar en refrescar y el usuario abre el clon antes de que aparezcan los productos en cache.
4. Si el `INSERT` de productos falla, hoy se hace `throw` pero el presupuesto vacío ya quedó creado, dejando un borrador huérfano sin productos (justo el síntoma reportado).

## Cambios

### `src/hooks/usePresupuestoActions.ts` — `clonarPresupuesto`

- Validar que la lectura de productos devuelva un array real antes de continuar. Si el `select` falla o devuelve `null`, abortar **antes** de crear el presupuesto.
- Crear el presupuesto sólo después de tener los productos en memoria.
- Mapear cada producto cubriendo todos los campos persistidos: `nombre`, `descripcion`, `cantidad`, `precio_unitario`, `descuento_porcentaje`, `comentarios`, `total`, `precio_final_manual`, y `sessions` normalizando como hace `productosPresupuestoService` (stringify si viene como objeto/array no vacío, `null` si está vacío).
- Envolver la inserción de productos en try/catch: si falla, hacer `delete` del presupuesto recién creado para no dejar el borrador huérfano y mostrar `toast.error` con el detalle real (`error.message`).
- Loggear `productos.length` antes y después del `insert` para tener trazabilidad.
- Después del `insert` de productos, volver a leer `productos_presupuesto` del clon y verificar que la cantidad coincida; si no coincide, avisar al usuario.
- Llamar `await onRefresh()` y, si `onRefresh` retorna promesa, esperar antes de mostrar el toast de éxito.

### Verificación

- Probar el clon desde un presupuesto `rechazado` con varias líneas (incluido uno con sesiones de acreditación) y confirmar que el borrador resultante muestra todas las líneas inmediatamente.
- Confirmar en consola los logs nuevos (`[clonarPresupuesto] productos origen: N`, `productos clonados: N`).
- Confirmar en DB con una consulta puntual que `productos_presupuesto.count` del clon coincide con el original.

## Fuera de alcance

- No se modifica el cálculo de totales ni la lógica de `precio_final_manual` ya implementada.
- No se cambian políticas RLS ni el esquema de la tabla.
