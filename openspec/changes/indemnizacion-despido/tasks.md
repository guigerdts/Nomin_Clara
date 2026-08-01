# Tasks: Indemnización por Despido Sin Justa Causa

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 750–850 (≈790) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (types+module+tests) → PR 2 (UI+wiring+tests) |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Out of scope: `LiquidacionPage.module.css` (D8); `liquidacion.ts`/`rates.ts` unchanged.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Types + `indemnizacion.ts` + unit tests | PR 1 (≈390) | `npx vitest run src/lib/__tests__/indemnizacion.test.ts` | N/A — pure logic; unit tests are the proof | Delete module + test; revert `types.ts` |
| 2 | Section UI + css + wiring + component tests | PR 2 (≈395) | `npx vitest run src/pages/LiquidacionPage/__tests__/` | `npx vite dev` → `/liquidacion`: gate warning + fijo calc | Delete section + test; revert page + page test |

## Phase 1: Foundation — types + RED tests

- [x] 1.1 Add to `src/lib/types.ts`: `IndemnizacionContractType`, `Fijo/Indefinido/Obra` inputs, `IndemnizacionInputs` union, `IndemnizacionNotice`, `IndemnizacionResult`
- [x] 1.2 RED `indemnizacion.test.ts`: fijo — 60d → $3.600.000; vencido → 0 + "contrato ya vencido"; renewals ≥ 3 → HR advisory (REQ-2)
- [x] 1.3 RED: obra — 30d → $1.800.000; 10d → $900.000 floor; terminada → 0, floor NOT applied (REQ-4)

## Phase 2: Core logic — indefinido RED + GREEN

- [x] 2.1 RED: indefinido — 540d → 40 días → $2.334.540; 360d → 30 días → $1.750.905; SMMLV×10 → high → $16.049.962,50; SMMLV×10−1 → low (REQ-3)
- [x] 2.2 RED: auxilio never added; formula strings; every line legalRef "CST Art. 64" (REQ-5)
- [x] 2.3 GREEN `src/lib/indemnizacion.ts`: per-type helpers + `calculateIndemnizacion`; reuse `countCommercialDays`/`formatCOPExact`/`SMMLV`; local `formatFormulaNumber` copy (D13); never round days (D6); formatCOPExact amounts + total (D9)
- [x] 2.4 Run focused vitest — RED→GREEN green

## Phase 3: Integration — section UI + wiring

- [x] 3.1 Create `IndemnizacionSection.tsx`: gate radios (default "Despido sin justa causa"; b/c/d → warning, module NOT called), contractType default `'fijo'`, per-type inputs (renewals min 0 step 1; fijo anchors `dismissalDate`), ConceptLine results + notices + total, footnote
- [x] 3.2 Create `IndemnizacionSection.module.css`: reuse `.card`/`.alert-warning`/`.field-group` + local `.formula`/`.cita`/`.notice`
- [x] 3.3 Modify `LiquidacionPage.tsx`: render section below grid; prestaciones untouched
- [x] 3.4 Create `IndemnizacionSection.test.tsx`: gate b/c/d → warning, no result; fijo flow; renewals=4 → Art. 46 + "verifícalo con RR.HH."; defaults

## Phase 4: Verification

- [x] 4.1 Modify `LiquidacionPage.test.tsx`: coexistence — prestaciones unchanged
- [x] 4.2 `npx vitest run` — full suite green (268 baseline → 278 total)
- [x] 4.3 `npx tsc --noEmit && npx vite build` — green
