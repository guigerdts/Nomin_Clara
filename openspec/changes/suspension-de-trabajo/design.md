# Design: Suspensión del contrato de trabajo (CST Arts. 51 y 53)

## Technical Approach

Pure `src/lib/suspension.ts` first (RED→GREEN), then `SuspensionSection.tsx` + own `.module.css`, composed as third section in `LiquidacionPage` below `IndemnizacionSection`. Educational + tracking only — no pesos, no `liquidacion.ts` integration (proposal contract). Maps the spec's 6 ADDED requirements 1:1; D1/D2/D3 accepted as fixed. Persistence mirrors `useDraftQuincena` (lazy-load try/catch, persist on mutation, key `nomina-clara-suspensiones`). Links reused from `GlosarioRecargos` `OFFICIAL_LINKS`.

## Architecture Decisions

| # | Option | Tradeoff | Decision |
|---|--------|----------|----------|
| D1 (accepted) | Causal selector | — | 10 options: 8 Art. 51 + incapacidad + licencia (fixed) |
| D2 (accepted) | Art. 112 warning | — | Conditional field; threshold 8 (primera) / 60 (reincidencia), never generic (fixed) |
| D3 (accepted) | Registry | — | Full CRUD, localStorage `nomina-clara-suspensiones` (fixed) |
| D4 | Module shape | Big builder vs small functions | CAUSALES metadata + 5 pure functions; no aggregator (no calculation) |
| D5 | Types location | Colocation vs shared | Extend `types.ts` (indemnizacion precedent) |
| D6 | Day count | Reuse `countCommercialDays` vs own | Own inclusive calendar-day count (commercial 30-day rule ≠ duration) |
| D7 | Checklist variant | Per-causal branches vs flag | `special?: boolean` drives variant + exception callout |
| D8 | Date handling | Clock vs record-anchored | Record dates only; never `new Date()`/today (D12-style) |
| D9 | Persistence | Context vs local state | Local `useState` + persist-on-mutation; no context |
| D10 | Educational copy | New links vs reuse | Static JSX (GlosarioRecargos pattern); `OFFICIAL_LINKS` verbatim |
| D11 | `isFirstDisciplinary` semantics | Optional-with-silent-fallback vs required-in-UI | Split by layer: UI REQUIRES explicit answer for `suspension-disciplinaria` (cannot save without it; field hidden for the other 9 causales via D7 flag); pure function keeps `?? true` as defensive fallback for incomplete data (tests/migrations), but the normal UI flow never depends on it |

## Data Flow

```
SuspensionSection (local useState records + form fields)
  ├─ mount → JSON.parse(localStorage key) (try/catch; version ≠ 1 → empty)
  ├─ add/edit → causal === 'suspension-disciplinaria'
  │     → isFirstDisciplinary REQUIRED (blocked without explicit answer) → isValidPeriod → append/replace → persist
  │   else (9 causales) → isFirstDisciplinary field NOT rendered (D7) → append/replace → persist
  ├─ delete → filter → persist
  └─ per record: buildChecklist → standard|special;
     disciplinaria && shouldShowExcessWarning → alert(threshold)
LiquidacionPage: <IndemnizacionSection /> → <SuspensionSection />
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/types.ts` | Modify | `SuspensionCausal`, `SuspensionRecord`, `SuspensionStore` |
| `src/lib/suspension.ts` | Create | CAUSALES, thresholds, duration, validation, checklist |
| `src/lib/__tests__/suspension.test.ts` | Create | RED-first unit tests |
| `src/pages/LiquidacionPage/SuspensionSection.tsx` | Create | Educational + registry + warnings |
| `src/pages/LiquidacionPage/SuspensionSection.module.css` | Create | Section styles (IndemnizacionSection precedent) |
| `src/pages/LiquidacionPage/LiquidacionPage.tsx` | Modify | Render section below IndemnizacionSection |
| `src/pages/LiquidacionPage/__tests__/SuspensionSection.test.tsx` | Create | CRUD + warning + checklist tests |
| `src/pages/LiquidacionPage/__tests__/LiquidacionPage.test.tsx` | Modify | Third-section coexistence test |

## Interfaces / Contracts

```typescript
export type SuspensionCausal = 'fuerza-mayor' | 'muerte-empleador'
  | 'suspension-actividades' | 'licencia-acordada' | 'suspension-disciplinaria'
  | 'detencion-preventiva' | 'arresto-correccional' | 'huelga'
  | 'incapacidad-medica' | 'licencia-maternidad-paternidad';
export interface SuspensionRecord { id: string; startDate: string; endDate: string;
  causal: SuspensionCausal; isFirstDisciplinary?: boolean; }
export interface SuspensionStore { version: 1; records: SuspensionRecord[]; }
export interface CausalMeta { value: SuspensionCausal; label: string; legalRef: string;
  special?: boolean; }
export const CAUSALES: readonly CausalMeta[];
export function getDisciplinaryThreshold(isFirst: boolean): 8 | 60;
export function getDurationDays(start: string, end: string): number;
export function isValidPeriod(start: string, end: string): boolean;
export function shouldShowExcessWarning(r: SuspensionRecord): boolean;
export function buildChecklist(r: SuspensionRecord): string;
```

`CAUSALES`: 10 entries, Spanish labels (e.g. `'Fuerza mayor o caso fortuito'`), `legalRef` `'CST Art. 51'`; `special: true` on `incapacidad-medica` and `licencia-maternidad-paternidad`. `getDurationDays` = inclusive calendar days (parse at `T12:00:00`, `daysBetween` pattern: `(end − start)/86400000 + 1`; invalid → 0). `shouldShowExcessWarning` = `causal === 'suspension-disciplinaria' && getDurationDays(r) > threshold` (`>` so exactly 8/60 never warn); `isFirstDisciplinary ?? true` → undefined treated as first (conservative). `buildChecklist` returns `STANDARD_CHECKLIST` (proposal-verbatim Spanish) or `SPECIAL_CHECKLIST` ("no se descuenta de NINGUNA prestación"). Persistence: `{ version: 1, records }`; mismatch → empty.

**`isFirstDisciplinary` semantics (D11) — two-layer contract**:
- **Type/function layer (defensive)**: `isFirstDisciplinary?: boolean` stays optional on `SuspensionRecord`; `shouldShowExcessWarning` keeps `?? true` so incomplete data (legacy records, direct test calls, future migrations) degrades conservatively to first-time (8-day threshold) instead of throwing or silently passing.
- **UI layer (required)**: the form NEVER depends on that fallback in the normal flow. When causal = `suspension-disciplinaria`, the field "¿Es tu primera suspensión disciplinaria, o ya tuviste otra antes?" is REQUIRED — the user cannot save the record without an explicit first-time/reincidencia answer (validation blocks submit). For the other 9 causales the field is NOT rendered (D7 conditional sub-field). A record persisted from the UI always carries an explicit `isFirstDisciplinary` when disciplinary; the fallback only exists for non-UI callers.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Thresholds (8/9, 60/61), duration, validation, checklist variants, non-disciplinary never warns; `?? true` defensive fallback on incomplete record (legacy/test call) | describe/it per spec scenario (suspension.test.ts) |
| Component | 10 options; CRUD + persistence; **suspension-disciplinaria requires explicit isFirstDisciplinary (submit blocked without it)**; field hidden for other 9 causales; warning only for disciplinaria with correct 8/60 threshold; checklist variants; Art. 53 table | RTL + BrowserRouter (IndemnizacionSection.test.tsx conventions) |
| Integration | Third section renders; prestaciones + indemnización unchanged; no label collisions | Extend LiquidacionPage.test.tsx |

## Threat Matrix

| Boundary | Applicability | Reason |
|----------|---------------|--------|
| Documentation-like paths | N/A | No executable/documentation paths read |
| Git repository selection | N/A | No VCS access |
| Commit state | N/A | No commit automation |
| Push state | N/A | No push automation |
| PR commands | N/A | No PR automation |

No routing change (existing `/liquidacion`). No RED threat tests.

## Migration / Rollout

No migration — client-only, no flags. Rollback: revert page; delete section files, module, types. Leftover localStorage key inert (no reader).

## Open Questions

- [ ] Exact CSJ jurisprudencia wording for the prima/intereses row — pinned from the product brief at apply time (legal copy; non-blocking).

## Apply-Time Contract (D11)

- `isFirstDisciplinary?: boolean` — optional at type level (defensive); REQUIRED in UI for `suspension-disciplinaria` (submit blocked without explicit answer); not rendered for the other 9 causales.
- The `?? true` fallback in `shouldShowExcessWarning` is defensive-only (legacy/migration/test callers). The normal UI flow always produces an explicit value; UI behavior must be verified by the component test that submit is blocked without it.
