## Plan: Mostrar total correcto del producto inmediatamente al agregar jornadas

### Problema
Al agregar una jornada de acreditación dentro de un producto, el "Total" mostrado en la fila del producto y en el resumen lateral NO se actualiza al monto de las jornadas. Solo después de guardar y refrescar el presupuesto el total se ve correcto. El cálculo en `useProductManagement` sí actualiza el campo `total`, pero hay dos puntos donde la UI sigue mostrando un valor desincronizado:

1. La fila del producto (`ProductMainRow`) confía 100% en `producto.total`, que puede quedar atrás cuando el efecto de sincronización entre `AccreditationSessionsManager` (estado interno) y el padre se desfasa.
2. La condición de "breakdown" usa `(producto as any).baseTotal && sessionsTotal` — al setear `baseTotal=0` el desglose se omite, pero al guardar/cargar desde DB tampoco se restituye, lo que da resultados visuales distintos antes/después de refrescar.

### Cambios

#### 1. `src/components/presupuesto/components/ProductMainRow.tsx`
- Calcular en render un `displayTotal` que, si `producto.sessions?.length > 0` y la suma de `monto` es `> 0`, use directamente esa suma; en caso contrario, use `producto.total`.
- Reemplazar `formatearPrecio(producto.total)` por `formatearPrecio(displayTotal)` en ambos branches.
- Quitar la dependencia de `(producto as any).baseTotal && sessionsTotal` para mostrar el desglose: mostrar solo "Jornadas: …" cuando hay sessions; nunca mostrar "Base + Jornadas" para productos de acreditación (confirmado por la regla de negocio actual: sólo se considera el monto de las jornadas).

#### 2. `src/components/presupuesto/components/AccreditationSessionsManager.tsx`
- Eliminar el patrón frágil de `isInternalUpdate`/`lastExternalSessions` y trabajar directamente sobre `externalSessions` como única fuente de verdad:
  - Quitar `useAccreditationSessions(externalSessions)` interno; las acciones (`addSession`, `updateSession`, `removeSession`) construyen el nuevo arreglo a partir de `externalSessions` y llaman `onSessionsChange(nuevoArreglo)` directamente.
  - Esto asegura que cada cambio dispare inmediatamente `onActualizarProducto(id, 'sessions', …)` y que el estado del padre (y el `total` derivado) se actualicen en el mismo ciclo de render.

#### 3. `src/hooks/useProductManagement.ts`
- En `actualizarProducto`, cuando `campo === 'sessions'`, mantener la lógica actual pero también escribir `precio_unitario` y `cantidad` "neutralizados" para evitar confusión (`cantidad` se conserva, pero el cálculo siempre usa `sessionsTotal`).
- En `setProductosFromExternal`, si un producto trae `sessions` con monto, recalcular `producto.total = sum(sessions.monto)` al cargar (defensa contra registros legacy en DB con totales viejos).

### Resultado esperado
- Al agregar la primera jornada, la columna "Total" del producto cambia inmediatamente al monto de las jornadas (sin necesidad de guardar ni refrescar).
- El "Resumen del Presupuesto" lateral y el botón Guardar reflejan el mismo valor.
- Al refrescar la página, el total mostrado coincide con el valor en pantalla previo al refresco.
