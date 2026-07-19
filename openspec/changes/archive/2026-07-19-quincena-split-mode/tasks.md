# Tasks: Modo de distribución de deducciones por quincena

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation (types + helpers)

- [x] 1.1 — `types.ts`: add `export type DeductionSplitMode = 'even' | 'second-fortnight' | 'first-fortnight'`
- [x] 1.2 — `deductions.ts`: add `quincenaShare(amount, mode)` helper and `appliedMode` to `calculateNetPay()` return
- [x] 1.3 — `deductions.ts`: `calculateNetPay()` signature gains `splitMode?: DeductionSplitMode` (default `'even'`)

## Phase 2: Core Implementation

- [x] 2.1 — `CalculatorPage.tsx`: add `splitMode` state initialized from `localStorage.getItem('deduction-split-mode')`, save on change
- [x] 2.2 — `DeduccionesForm.tsx`: add props `splitMode` + `onSplitModeChange`, render radio group with help text explaining each mode
- [x] 2.3 — `TotalsPanel.tsx`: replace `item.amount / 2` with `quincenaShare(item.amount, splitMode)`, add mode label subtitle

## Phase 3: Testing

- [x] 3.1 — `deductions.test.ts`: unit tests for `calculateNetPay` — 3 modes (verify both numeric result AND `appliedMode` field), backwards compat (no param = `'even'`), zero deductions
- [x] 3.2 — `deductions.test.ts`: unit tests for `quincenaShare` — each mode returns correct per-item quincena share
- [x] 3.3 — Run `vitest` + `tsc --noEmit` + `vite build`, verify all pass

## Phase 4: Storage migration

- [x] 4.1 — Confirm existing localStorage without `deduction-split-mode` defaults to `'even'` (no data loss)
