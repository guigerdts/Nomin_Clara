# Tasks: Liquidación Básica (Prestaciones Sociales)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500–700 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (lib + tests) → PR 2 (page + routing + component tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Pure `liquidacion.ts` module + types + unit tests | PR 1 | `npx vitest run src/lib/__tests__/liquidacion.test.ts` | N/A — pure logic; unit tests are the proof, no UI runtime surface | Delete `liquidacion.ts` + test; revert `types.ts` additions |
| 2 | `/liquidacion` page, route, NavLink, component tests | PR 2 | `npx vitest run src/pages/LiquidacionPage/__tests__/LiquidacionPage.test.tsx` | `npx vite dev` → open `/liquidacion`, verify worked example card + one live calc | Remove route + NavLink; delete `LiquidacionPage/` |

## Phase 1: Foundation (types + date helpers, RED-first)

- [x] 1.1 RED: `liquidacion.test.ts` failing tests for `countCommercialDays` (01-ene→31-jul=210, 01-ene→31-ene=30, start==end=0, 15-ene→31-jul=197) per spec req "Días trabajados"
- [x] 1.2 RED: failing tests for `detectSemester`/`semesterOverlapDays` (30-jun→180, 31-dic→180, 31-jul→30) and `formatCOPExact` (es-CO, 2 decimals)
- [x] 1.3 GREEN: add `LiquidacionInputs`, `ConceptLine`, `LiquidacionResult` to `src/lib/types.ts`
- [x] 1.4 GREEN: implement `countCommercialDays`, `detectSemester`, `semesterOverlapDays`, `formatCOPExact` in `src/lib/liquidacion.ts`

## Phase 2: Core Logic (4 formulas + aggregator, RED-first)

- [x] 2.1 RED: failing tests `calculateCesantias` ($1.166.666,67 @ 2.000.000×210÷360; 0 @ salario 0) + `calculateIntereses` ($81.666,67; 0 @ 0 días) per spec
- [x] 2.2 RED: failing tests `calculatePrima` ($166.666,67 @ 2.000.000×30÷360; 180 @ ene→30-jun; 0 no-overlap; two-semester warning) + `calculateVacaciones` ($510.680,63; negative unclamped + warning)
- [x] 2.3 RED: failing tests `calculateLiquidacion` aggregator (auxilio auto via `getTransportAllowance`, Aplica/No aplica, ConceptLine[] with concepto/formula/legalRef)
- [x] 2.4 GREEN: implement 4 formulas + `calculateLiquidacion` in `src/lib/liquidacion.ts` reusing `SMMLV`/`TRANSPORT_ALLOWANCE_2026`/`getTransportAllowance` from `rates.ts`; never `calculateBreakdown`

## Phase 3: Integration (page + routing)

- [ ] 3.1 Create `src/pages/LiquidacionPage/LiquidacionPage.tsx`: form (start/end/salario/días disfrutados), local `useState`, ConceptLine rows with formula + legalRef (GlosarioRecargos pattern)
- [ ] 3.2 Create `LiquidacionPage.module.css`: reuse global tokens (`.card`, `.badge`, `.alert-warning`, `.monetary`) + local `.formula`/`.cita`/`.pct`
- [ ] 3.3 Add lazy route `/liquidacion` in `src/App.tsx` (Suspense fallback same as `/compare`) + NavLink "Liquidación" in `src/components/Header.tsx`
- [ ] 3.4 Add fixed non-editable worked example card (01-ene→31-jul-2026, salario $1.750.905; pinned $1.166.666,67 / $81.666,67 / $166.666,67 / $510.680,63)

## Phase 4: Testing / Verification

- [ ] 4.1 Create `LiquidacionPage/__tests__/LiquidacionPage.test.tsx` (RTL + BrowserRouter): form→calculate→render shows concepto/formula/cita per line, auxilio badge, both warnings, example card non-editable; NavLink → `/liquidacion`
- [ ] 4.2 Run `npx vitest run` — full suite green (existing 66 + new)
- [ ] 4.3 Run `npx tsc --noEmit && npx vite build` — build green
