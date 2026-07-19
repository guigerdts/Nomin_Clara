# Design: PR3 — ComparePage + cleanup + vite-to-root

## Technical Approach

Extender `SavedRecord` con datos de deducciones, construir ComparePage con tabla sorteable y chart Canvas, y ejecutar la reorganización física del repo en orden secuencial estricto para evitar conflictos de nombres entre legacy y nuevo código.

## Architecture Decisions

### Decision: deductionsInput (no breakdown) en SavedRecord

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Guardar `deductionsBreakdown` completo | Más grande, duplica datos computables | ❌ Rejected |
| Guardar solo `deductionsInput` + `splitMode` | Compacto, recalcular en runtime con el splitMode guardado | ✅ **Chosen** |

### Decision: SplitMode por registro

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Usar localStorage del viewer (`deduction-split-mode`) | Neto mal calculado si viewer y registro tienen modos distintos | ❌ Rejected |
| Guardar `splitMode` con cada registro | Neto correcto independiente de quién ve la tabla | ✅ **Chosen** |

### Decision: ComparisonTable con o sin columna de neto

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Mostrar neto solo cuando el registro tiene deductionsInput | Degradación elegante; legacy no muestra columna vacía | ✅ **Chosen** |
| Forzar neto=devengado cuando faltan deductions | Engañoso: sugeriría que no hay deducciones cuando tal vez sí las hay | ❌ Rejected |

## Carga de registros para comparación

Cada registro se procesa individualmente al cargar la ComparePage:
1. Si tiene `deductionsInput` y `splitMode`: computar `computeDeductions(salary, deductionsInput)` → `calculateNetPay(devengado, breakdown, splitMode)` → mostrar devengado + deducciones + neto
2. Si no: mostrar devengado, deducciones = "—", neto = "—"

## Secuencia explícita del move vite/ → raíz

ORDEN CRÍTICO — no intercambiar pasos:

1. **Borrar legacy primero**: `rm index.html comparar.html js/ css/` — si hay archivos con el mismo nombre entre legacy y nuevo, el legacy debe desaparecer antes de que el nuevo ocupe ese path
2. **Mover `vite/` a raíz**: `mv vite/src . && mv vite/index.html . && mv vite/public . 2>/dev/null` — mueve cada contenido de `vite/` un nivel arriba
3. **Actualizar `vite.config.ts`**: eliminar `root: './vite'`, cambiar `outDir` a `'dist'` (sin `../dist`)
4. **Actualizar `package.json`**: scripts `dev`, `build`, `preview` ya no necesitan `--root` implícito porque `vite.config.ts` ya no tiene root override
5. **Actualizar `vercel.json`**: verificar que las rutas sigan siendo correctas (el build output sigue en `dist/`)
6. **Build limpio**: `tsc --noEmit && vite build` para verificar que todos los imports y paths funcionan
7. **Si `vite/` queda vacío**: `rmdir vite`

Riesgo por paso fuera de orden: mover `vite/index.html` a la raíz ANTES de borrar `index.html` legacy → conflicto de nombre `mv` falla.

## Data Flow

```
handleSave en CalculatorPage
  → SavedRecord { ..., deductionsInput, splitMode }
  → localStorage

ComparePage on mount
  → getAllRecords()
  → forEach record:
      if record.deductionsInput && record.splitMode:
        deductionsBreakdown = computeDeductions(record.salary, record.deductionsInput)
        neto = calculateNetPay(record.grandTotal, deductionsBreakdown, record.splitMode)
      else:
        mostrar "—" en columnas deducciones/neto
  → render ComparisonTable + ComparisonChart
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `vite/src/lib/types.ts` | Modify | + `deductionsInput?` + `splitMode?` en SavedRecord |
| `vite/src/pages/CalculatorPage/CalculatorPage.tsx` | Modify | handleSave persiste deductionsInput + splitMode |
| `vite/src/pages/ComparePage/ComparePage.tsx` | Create | Página principal con lógica de carga |
| `vite/src/pages/ComparePage/ImportSection.tsx` | Create | File input + JSON import con validación |
| `vite/src/pages/ComparePage/ComparisonTable.tsx` | Create | Tabla sorteable con devengado/deducciones/neto |
| `vite/src/pages/ComparePage/ComparisonChart.tsx` | Create | Canvas chart (useRef/useEffect) |
| `vite/src/pages/ComparePage/*.module.css` | Create | Estilos por componente |
| `vite/src/App.tsx` | Modify | Reemplazar placeholder con `<ComparePage />` |
| `index.html` (raíz) | Delete | Legacy vanilla JS entry |
| `comparar.html` | Delete | Legacy compare page |
| `js/*.js` (5) | Delete | Legacy vanilla JS modules |
| `css/styles.css` | Delete | Legacy styles |
| `vite/src/` → `src/` | Move | Código fuente a raíz |
| `vite/index.html` → `index.html` | Move | Entry a raíz |
| `vite.config.ts` | Modify | Eliminar `root: './vite'`, outDir a `'dist'` |
| `package.json` | Modify | Scripts post-move |
| `vercel.json` | Modify (verify) | Build config post-move |
| `README.md` | Modify | Instrucciones finales |

## Interfaces / Contracts

```typescript
// types.ts — SavedRecord extendido
export interface SavedRecord {
  id: string;
  createdAt: string;
  alias: string;
  quincena: string;
  salary: number;
  transportAllowance: number;
  inputs: PayrollInput;
  breakdown: BreakdownEntry[];
  totalCalculated: number;
  totalActual: number | null;
  totalOT: number;
  difference: number | null;
  deductionsInput?: DeductionsInput;   // nuevo
  splitMode?: DeductionSplitMode;      // nuevo
}
```

```typescript
// ComparePage — per-record net recomputation
function computeRecordNeto(record: SavedRecord): { 
  devengado: number; 
  deducciones: number | null; 
  neto: number | null;
} {
  const devengado = record.totalCalculated;
  
  if (!record.deductionsInput || !record.splitMode) {
    return { devengado, deducciones: null, neto: null };
  }
  
  const deductions = computeDeductions(record.salary, record.deductionsInput);
  const { netPay, quincenaDeductions } = calculateNetPay(
    devengado, deductions, record.splitMode
  );
  return { devengado, deducciones: quincenaDeductions, neto: netPay };
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `computeRecordNeto` helper | Pure function — with deductionsInput, without, edge modes |
| Integration | ComparePage import + render | RTL — import mock JSON, table shows rows |
| Integration | Sort toggle on table columns | RTL — click sort header, verify order |
| Build | vite build after file move | `tsc --noEmit && vite build` desde raíz |
| Regression | CalculatorPage save record | RTL — record saved incluye deductionsInput + splitMode |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

**Pasos post-commit (manual):**
1. Verificar que Vercel deploy automático funciona con la nueva estructura (sin `root: ./vite`)
2. Si falla, revertir commit y ajustar `vercel.json` con `root` si fuera necesario

## Open Questions

- [ ] En la ComparisonTable: ¿mostrar el modo de splitMode como tooltip en la columna de deducciones o no exponerlo? Decisión: NO, la tabla muestra resultados, no config. El modo es irrelevante para quien compara.
- [ ] Chart: ¿qué ejes? Decisión: eje X = alias, eje Y = devengado, con overlay opcional de neto si el registro tiene deducciones.
