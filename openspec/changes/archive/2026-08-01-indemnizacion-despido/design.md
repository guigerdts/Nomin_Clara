# Design: Indemnización por despido sin justa causa

## Technical Approach

Pure `src/lib/indemnizacion.ts` first (RED→GREEN), then `IndemnizacionSection` below the prestaciones grid in `LiquidacionPage`. Reuses `countCommercialDays`/`formatCOPExact` and `SMMLV` — no changes to either dependency (proposal contract). Maps spec REQ-2/3/4 1:1; gate is UI-only.

## Architecture Decisions

| # | Option | Tradeoff | Decision |
|---|--------|----------|----------|
| D1 | Module shape | Helpers testable; aggregator alone hides intermediates | Per-type helpers + `calculateIndemnizacion` aggregator (liquidacion D1 pattern) |
| D2 | Types location | types.ts already owns `ConceptLine`/`LiquidacionResult`; colocation splits the domain | Extend `types.ts` with union + result |
| D3 | Gate | Termination param → null branches; UI gate keeps module honest | UI gates; module has no termination concept |
| D4 | Day count | Reuse vs own copy | Reuse `countCommercialDays` (verified: full×30+partial, start≥end→0); fijo/obra `(dismissalDate, plannedEnd)`, indefinido `(serviceStart, dismissalDate)` |
| D5 | Indefinido branch | Exactly 10 SMMLV must hit high | `salary >= SMMLV * 10` → 20+15; threshold from constant, never hardcoded |
| D6 | Rounding | Round days vs exact money | Never round days; exact amount; `formatCOPExact` rounds display (510.680,625→$510.680,63) |
| D7 | Base salary | Auxilio is not salary (Ley 1ª/1963 Art. 7) | Salary only; never calls `getTransportAllowance` |
| D8 | Extraction | Page 214 lines; section adds ~180 → ~400 | Extract `IndemnizacionSection.tsx` + own `.module.css` (PayrollForm precedent) |
| D9 | Formatting | Exact vs rounded | `formatCOPExact` for all amounts + total; formatCOP only in hints |
| D10 | Art. 46 notice | UI-conditional vs module-produced | Module `notices[]` with legalRef; always for fijo; HR advisory when `renewals >= 3`; footnote static in UI |
| D11 | Renewals input | select vs number | Number input, min 0, step 1 (daysTaken pattern) |
| D12 | Defaults / anchors | — | Gate default `'despido-sin-justa-causa'`, contractType `'fijo'`; fijo uses `dismissalDate`, never "today" |
| D13 | Formula helper | Export `formatFormulaNumber` modifies dependency | Local copy in indemnizacion.ts |

## Data Flow

```
IndemnizacionSection (local useState)
  ├─ gate ≠ despido → warning card (module NOT called)
  └─ gate = despido → contractType → per-type inputs → Calcular
       └─ calculateIndemnizacion(inputs)
            ├─ countCommercialDays(dismissal → plannedEnd) [fijo/obra]
            │   └─ 0 días → 0 + warning "ya vencido/terminada"
            ├─ countCommercialDays(serviceStart → dismissal) [indefinido]
            │   └─ SMMLV×10 → branch → 30+20×años | 20+15×años
            └─ Result { lines[1] Art. 64, notices Art. 46, total }
LiquidacionPage: <IndemnizacionSection /> below grid; prestaciones untouched
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/types.ts` | Modify | Contract-type, 3 inputs, union, `IndemnizacionNotice`, `IndemnizacionResult` |
| `src/lib/indemnizacion.ts` | Create | Pure module: helpers + aggregator + `formatFormulaNumber` copy |
| `src/lib/__tests__/indemnizacion.test.ts` | Create | RED-first per-type + boundary tests |
| `src/pages/LiquidacionPage/IndemnizacionSection.tsx` | Create | Gate + contract-type + per-type inputs + results + footnote |
| `src/pages/LiquidacionPage/IndemnizacionSection.module.css` | Create | Section styles (reuses global `.card`, `.alert-warning`, `.field-group`) |
| `src/pages/LiquidacionPage/LiquidacionPage.tsx` | Modify | Render section below grid |
| `src/pages/LiquidacionPage/LiquidacionPage.module.css` | Unchanged | Styles moved to section module (supersedes proposal) |
| `src/pages/LiquidacionPage/__tests__/IndemnizacionSection.test.tsx` | Create | Gate + fijo flow + notice tests |
| `src/pages/LiquidacionPage/__tests__/LiquidacionPage.test.tsx` | Modify | Coexistence test |

## Interfaces / Contracts

```typescript
export type IndemnizacionContractType = 'fijo' | 'indefinido' | 'obra';
export interface IndemnizacionFijoInputs { type: 'fijo'; salary: number; startDate: string;
  plannedEnd: string; dismissalDate: string; renewals: number; }
export interface IndemnizacionIndefinidoInputs { type: 'indefinido'; salary: number;
  serviceStart: string; dismissalDate: string; }
export interface IndemnizacionObraInputs { type: 'obra'; salary: number; startDate: string;
  plannedEnd: string; dismissalDate: string; }
export type IndemnizacionInputs = IndemnizacionFijoInputs | IndemnizacionIndefinidoInputs
  | IndemnizacionObraInputs;
export interface IndemnizacionNotice { text: string; legalRef: string; }
export interface IndemnizacionResult { inputs: IndemnizacionInputs;
  type: IndemnizacionContractType; days: number; effectiveDays: number;
  years?: number; branch?: 'low' | 'high'; threshold?: number;
  lines: ConceptLine[]; notices: IndemnizacionNotice[]; total: number; }
export function calculateIndemnizacion(inputs: IndemnizacionInputs): IndemnizacionResult;
```

Formulas: fijo `(salario ÷ 30) × díasRestantes` (0 si vencido); indefinido `añosAdicionales = (díasServicio − 360) ÷ 360` (0 si ≤ 360), `díasTotal = 30+20×años | 20+15×años`; obra `max(díasRestantes, 15)`, 0 si terminada (floor NOT applied). Line: concepto `'Indemnización por despido sin justa causa'`, legalRef `'CST Art. 64'`, formula with real inputs (e.g. `1.750.905 ÷ 30 × 40`). Radios in `fieldset/legend` (no radio precedent; ARIA-group). UI copy in Spanish.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | fijo 60d→$3.600.000, vencido→0+warning; indefinido 540d@1SMMLV→40d→$2.334.540, exact 360d→30d, 10 SMMLV→high / −1→low; obra 30d, 10d→$900.000, terminada→0; auxilio never added; formulas; $16.049.962,50 | describe/it + `toBeCloseTo(..., 2)`, spec scenarios |
| Component | Gate (b)(c)(d)→warning, no result; fijo flow; renewals=4→Art. 46 + HR advisory; footnote; defaults | RTL + BrowserRouter (page-test conventions) |
| Integration | Coexistence: prestaciones unchanged; section below | Extend LiquidacionPage.test.tsx |

## Threat Matrix

| Boundary | Applicability | Reason |
|----------|---------------|--------|
| Documentation-like paths | N/A | No markdown/executable paths read or executed |
| Git/commit/push/PR | N/A | No VCS or PR automation |
| Subprocess/shell | N/A | No user input reaches a shell |

No routing change (existing `/liquidacion` route). No RED threat tests.

## Migration / Rollout

No migration — client-only, no storage, no flags. Rollback: remove section, module, tests; revert page + types additions.

## Open Questions

None — resolved: half-day exact (D6); same-day → 0 (verified in code/tests); fijo anchors `dismissalDate` (D12); renewals = number input (D11).
