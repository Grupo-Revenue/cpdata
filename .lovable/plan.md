## Problema detectado

En la vista de jornadas dentro del presupuesto, cada jornada tiene dos campos:
- `precio`: el valor total de esa jornada (ya incluye el cálculo por personal — viene de la calculadora o del input manual)
- `monto`: igual a `precio` (es el total de la jornada)

Sin embargo, el PDF (`src/components/pdf/components/PDFProductTable.tsx`, línea 157) calcula:

```ts
const subtotal = session.precio * totalPersonal;
```

Esto multiplica el precio (que ya es el total) por la cantidad de acreditadores + supervisores, **duplicando/triplicando el monto** en el detalle de jornadas del PDF. Por eso el valor mostrado en el PDF no coincide con el que se ve en la pantalla de "Jornadas de Acreditación" del presupuesto.

El total general del PDF (`PDFPricingSummary`) sí está correcto porque usa `calcularTotalesPresupuesto`, que suma `session.monto`. La inconsistencia aparece solo en la columna "Total" del detalle por jornada y, además, el "Total" del producto en la fila padre puede mostrar un valor que no cuadra con la suma visible de las jornadas listadas (porque las jornadas listadas en el PDF están infladas).

## Cambio propuesto

### 1. `src/components/pdf/components/PDFProductTable.tsx`

En la función `renderSessionDetails`:

- Reemplazar:
  ```ts
  const subtotal = session.precio * totalPersonal;
  ```
  por:
  ```ts
  const subtotal = Number(session.monto) || Number(session.precio) || 0;
  ```

- Ajustar el filtro de jornadas válidas para no descartar jornadas con `monto > 0` aunque no tengan personal cargado:
  ```ts
  const monto = Number(session.monto) || Number(session.precio) || 0;
  return monto > 0;
  ```

Con esto, el subtotal mostrado por jornada en el PDF coincidirá exactamente con el "Monto" visible en la tabla de Jornadas de Acreditación del presupuesto, y la suma cuadrará con el total del producto y con el total general.

### Resultado esperado

- El detalle de jornadas en el PDF mostrará el mismo monto que se ve al editar el presupuesto.
- El "Total" del producto será igual a la suma de los montos de jornadas listados.
- El total general (subtotal/IVA/total) ya es correcto y no cambia.

No se requieren cambios en base de datos, hooks ni servicios — el bug es exclusivo del renderizado del PDF.