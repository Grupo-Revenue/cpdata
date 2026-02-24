

## Plan: Corregir bug de cálculo en productos con jornadas de acreditación

### Cambios en 4 archivos

#### 1. `src/utils/quoteCalculations.ts` (líneas 17-43)
- **Subtotal (líneas 18-28):** Si el producto tiene sessions con montos, usar SOLO `sessionsTotal` (no sumar `baseTotal`)
- **Descuentos (líneas 30-43):** Aplicar descuento solo sobre `sessionsTotal` cuando hay sessions

#### 2. `src/hooks/useProductManagement.ts`
- **Líneas 97-112 (sessions update):** `total = sessionsTotal` solamente, sin sumar `baseTotal`
- **Líneas 184-195 (price/qty/discount changes):** Mismo fix: si hay sessions, total = sessionsTotal (sin base)

#### 3. `src/hooks/useQuotePersistence.ts` (líneas 47-52)
- Calcular total considerando sessions: si el producto tiene sessions, usar solo sessionsTotal

#### 4. `src/services/presupuestoService.ts`
- **Líneas 244-256 (crear):** `finalTotal = sessionsTotal` cuando hay sessions (con descuento aplicado a sessions)
- **Líneas 359-371 (actualizar):** Mismo fix

### Resultado esperado
- Presupuesto 5152A: mostrará $390,000 (solo jornadas) en vez de $915,000
- Productos sin jornadas: sin cambio en su cálculo

