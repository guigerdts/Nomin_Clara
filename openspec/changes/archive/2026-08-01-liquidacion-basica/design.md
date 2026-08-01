# Design: Liquidación básica (prestaciones sociales)

## Technical Approach

Pure `src/lib/liquidacion.ts` first (RED→GREEN via `npx vitest run`), then a lazy `/liquidacion` page (ComparePage pattern). Reuses `SMMLV`, `TRANSPORT_ALLOWANCE_2026`, `getTransportAllowance` from `rates.ts`; **never** imports `calculateBreakdown` (quincena allowance-halving). Honors spec decisions: commercial 30-day months everywhere, semester auto-detected from end date, negative vacaciones unclamped with neutral warning, auto-derived auxilio badge, fixed worked example card. Legal delta already removes the `legal` non-goal.

## Architecture Decisions

| # | Option | Tradeoff | Decision |
|---|--------|----------|----------|
| D1 | Module shape: per-formula exports vs one aggregate | Per-formula = independently testable, maps spec reqs 1:1; aggregate alone hides intermediates | Both: per-formula pure functions + `calculateLiquidacion` aggregator emitting `ConceptLine[]` |
| D2 | Day count: `countCommercialDays` (full months × 30 + partial-month actual days) vs full-month-if-touched vs calendar days | Calendar gives 212 for the example — breaks ÷360 consistency (spec audit note); full-month-if-touched overstates days for mid-month starts (systematically favors the worker incorrectly, damaging credibility) | `countCommercialDays`: full months × 30 + actual days of the partial month; `start === end → 0`; example stays 210 (01-ene→31-jul = 7 full months), 15-ene→31-jul = 6×30 + 17 = 197 |
| D3 | Semester: `detectSemester(end)` = month 1–6 → 1, 7–12 → 2; overlap = `countCommercialDays(max(start, semesterStart), end)` | Clamping start to semester start avoids double counting and keeps 180 + 30 = 210 | Auto-detect + clamp; "prior semester paid" warning when `detectSemester(start) !== detectSemester(end)` |
| D4 | Amount display: reuse `formatCOP` (rounds) vs cents formatter | `formatCOP` rounds: $510.681 ≠ spec's pinned $510.680,63 (verified: ÷360/÷720 recur) | Add `formatCOPExact` (es-CO, 2 decimals) in `liquidacion.ts`; spec pins cent values |
| D5 | State: local `useState` vs `useDraftQuincena` | Draft hook is localStorage quincena-schedule-specific, not reusable; this form is one-shot | Local `useState` in page |
| D6 | CSS: import GlosarioRecargos.module.css vs own module | Importing couples hashed classes across components; per-page module matches ComparePage pattern | New `LiquidacionPage.module.css` reusing global tokens (`.card`, `.badge`, `.alert-warning`, `.monetary`) + local `.formula`/`.cita`/`.pct` |
| D7 | Types location | `types.ts` holds shared domain interfaces (`PayrollInput`, `BreakdownEntry`, …) | Add `LiquidacionInputs`, `ConceptLine`, `LiquidacionResult` to `src/lib/types.ts` |

## Data Flow

```
LiquidacionPage form (fecha inicio, fecha fin, salario, días disfrutados)
   │
   ├─ getTransportAllowance(salary) ──→ auxilio + badge (Aplica/No aplica)
   │
   └─ calculateLiquidacion(inputs)
        ├─ countCommercialDays ─────────────→ days (210)
        ├─ detectSemester + semesterOverlapDays ─→ semester, semesterDays (30)
        ├─ calculateCesantias / Intereses / Prima / Vacaciones
        └─ ConceptLine[] { concepto, formula(real inputs), legalRef, amount, warning? }
   │
   └─ Page: GlosarioRecargos-pattern lines + warnings + WorkedExampleCard (fixed)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/liquidacion.ts` | Create | Pure module: day-count, semester, 4 formulas, aggregator, `formatCOPExact` |
| `src/lib/types.ts` | Modify | Add `LiquidacionInputs`, `ConceptLine`, `LiquidacionResult` |
| `src/lib/__tests__/liquidacion.test.ts` | Create | RED-first per-formula + day/semester edge tests |
| `src/pages/LiquidacionPage/LiquidacionPage.tsx` | Create | Form + results + fixed example card |
| `src/pages/LiquidacionPage/LiquidacionPage.module.css` | Create | Page styles, local `.formula`/`.cita`/`.pct` |
| `src/pages/LiquidacionPage/__tests__/LiquidacionPage.test.tsx` | Create | Component tests (RTL + BrowserRouter) |
| `src/App.tsx` | Modify | `lazy` route `/liquidacion`, same Suspense fallback as `/compare` |
| `src/components/Header.tsx` | Modify | NavLink "Liquidación" (`isActive` className pattern) |

## Interfaces / Contracts

```typescript
// src/lib/types.ts
export interface LiquidacionInputs {
  startDate: string; endDate: string; salary: number; daysTaken: number;
}
export interface ConceptLine {
  concepto: string; formula: string; legalRef: string;
  amount: number; warning?: string;
}
export interface LiquidacionResult {
  inputs: LiquidacionInputs; auxilio: number; appliesTransport: boolean;
  days: number; semester: 1 | 2; semesterDays: number;
  lines: ConceptLine[]; total: number;
}

// src/lib/liquidacion.ts
export function countCommercialDays(start: string, end: string): number;
export function detectSemester(endDate: string): 1 | 2;
export function semesterOverlapDays(start: string, end: string): number;
export function calculateCesantias(salary: number, auxilio: number, days: number): number;
export function calculateIntereses(cesantias: number, days: number): number;
export function calculatePrima(salary: number, auxilio: number, semesterDays: number): number;
export function calculateVacaciones(salary: number, days: number, daysTaken: number): number;
export function calculateLiquidacion(inputs: LiquidacionInputs): LiquidacionResult;
export function formatCOPExact(value: number): string;
```

ISO dates parsed via `new Date(iso + 'T12:00:00')` (PayrollForm trick, avoids TZ shifts). Legal refs: `CST Art. 249`, `Ley 52 de 1975`, `CST Art. 306`, `CST Art. 186`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `countCommercialDays`: 7m→210, 1m→30, start==end→0, partial month 15-ene→31-jul→197 (6×30 + 17) | describe/it + `toBeCloseTo`, spec GIVEN/WHEN/THEN |
| Unit | 4 formulas with spec numbers (cesantías 1.166.666,67; intereses 81.666,67; prima 166.666,67; vacaciones 510.680,63) | `toBeCloseTo(..., 2)` |
| Unit | `semesterOverlapDays`: ene→30-jun→180, ene→31-dic→180, ene→31-jul→30; auxilio ≤2 SMMLV→249.095 / >2→0; warnings (two semesters, negative vacaciones) | edge-case tables |
| Component | form → calculate → render: every line shows concepto/formula/cita; badges; warnings; example card fixed + non-editable | RTL + BrowserRouter (CalculatorPage.test.tsx conventions) |
| Component | Navigation: Header NavLink → `/liquidacion` renders page | page-level with BrowserRouter |

## Threat Matrix

| Boundary | Applicability | Reason |
|----------|---------------|--------|
| Documentation-like paths | N/A | No markdown/executable paths read or executed |
| Git repository selection | N/A | No git invocation |
| Commit state | N/A | No VCS/index/worktree manipulation |
| Push state | N/A | No push/refspec handling |
| PR commands | N/A | No PR automation |

`/liquidacion` is a static react-router client route (ComparePage pattern); no user-supplied segment reaches a shell, subprocess, or VCS boundary. No RED threat tests required.

## Migration / Rollout

No migration required — client-only, no storage, no feature flags. Rollback: remove route + NavLink, delete `LiquidacionPage/`, `liquidacion.ts`, and tests; restore nothing else (legal delta is a spec-text removal).

## Open Questions

None.
