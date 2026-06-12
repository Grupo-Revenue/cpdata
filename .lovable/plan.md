## Quitar restricción del precio manual

El precio final manual debe aceptar cualquier valor ≥ 0, sin tope respecto al precio de lista (puede ser menor, igual o mayor, nunca numero negativo).

### Cambios

`**src/components/presupuesto/components/ProductMainRow.tsx**`

- Eliminar la variable `exceedsLista` y toda la lógica visual asociada (borde rojo en el input, mensaje "No puede superar el precio de lista").
- Mantener el input con estilo ámbar estándar siempre.
- Mostrar siempre la línea informativa "Desc. equiv.: X% (−$Y)" cuando el manual sea menor que el subtotal de lista. Cuando sea mayor, mostrar en su lugar "Recargo: +$Y" (informativo, sin error) o simplemente ocultar el detalle. Decisión: mostrar "Recargo equiv.: +$Y" en color neutro gris para dar feedback sin bloquear.
- No agregar validación adicional más allá de `num >= 0`.

### Fuera de alcance

- Lógica de cálculo (`quoteCalculations.ts`) ya soporta cualquier valor — no requiere cambios.
- Persistencia y PDF no cambian.