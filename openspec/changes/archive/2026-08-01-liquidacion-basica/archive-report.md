# Archive Report: liquidacion-basica

**Archived**: 2026-08-01
**Branch**: `liquidacion/pr2-ui`
**Artifact store**: openspec
**Status**: success — intentional-with-warnings (documentation-level only)

## What Was Built

Sub-módulo 1 of the `modulo-liquidacion-laboral` umbrella: a `/liquidacion` view computing prestaciones sociales for workers ending a contract (renuncia, despido, mutuo acuerdo, vencimiento).

- **Pure module** `src/lib/liquidacion.ts`: `countCommercialDays` (30-day commercial months, partial-month actual days), `detectSemester` / `semesterOverlapDays` (auto-detect + clamp), `calculateCesantias` (CST Art. 249), `calculateIntereses` (Ley 52 de 1975), `calculatePrima` (CST Art. 306), `calculateVacaciones` (CST Art. 186), `calculateLiquidacion` aggregator emitting `ConceptLine[]`, `formatCOPExact` (es-CO, 2 decimals). Reuses `SMMLV` / `TRANSPORT_ALLOWANCE_2026` / `getTransportAllowance` from `rates.ts`; **never** imports `calculateBreakdown`.
- **Types** `LiquidacionInputs`, `ConceptLine`, `LiquidacionResult` added to `src/lib/types.ts`.
- **Page** `src/pages/LiquidacionPage/` (lazy route `/liquidacion` in `App.tsx`, `SuspenseFallback` shared with `/compare`), Header NavLink "Liquidación", local `useState` form, ConceptLine rows with formula + legalRef (GlosarioRecargos pattern), auxilio badge (Aplica/No aplica), fixed non-editable worked example card, own CSS module reusing global tokens.
- **Legal spec**: the `legal` capability non-goal "No severance or vacation calculations" removed (delta's "After archive" instruction executed at archive time).

### Delivery
- PR 1 (lib + tests): commit `dc62d89`
- PR 2 (UI + route + nav + tests): commit `88ff6f6`
- Verify-report docs commit: `000d377`

## Verification Evidence (Final State)

| Metric | Value |
|--------|-------|
| Test suite | 254/254 passing (13 files) |
| Requirements | 9/9 compliant |
| Scenarios | 19/19 compliant |
| Type check | `npx tsc --noEmit` exit 0 (strict) |
| Build | `npx vite build` green; LiquidacionPage lazy chunk 8.05 kB (gzip 2.80 kB) |
| Tasks | 15/15 complete (all `[x]` in archived `tasks.md`) |
| Findings | 0 CRITICAL / 3 WARNING / 3 SUGGESTION |

Evidence anchors: `verify-report.md` in this archive (sha256 `1b7217c80865db3dfc8b97087c25274b35a4756065424588a68ad62bcce31dc8`), build/test hashes recorded in its YAML header.

### Native SDD Review
DONE and APPROVED (reviewGate.result: allow). Terminal receipts (both `terminal_state: approved`):
- `review-cc83483c6b22a096` — PR1 candidate
- `review-cc99b838f0098c5f` — corrected verify candidate (evidence outcome: passed)

Receipts live in `.git/gentle-ai/review-transactions/v2/`; not moved or modified by this archive.

## Spec Sync Performed

- **Delta** `specs/legal/spec.md` → **canonical** `openspec/specs/legal/spec.md`: removed requirement "Non-goal — 'No severance or vacation calculations'" from section 6 (Non-Goals), per the delta's `(Reason:)` / `(Migration:)` and its Verification section ("After archive"). All other `legal` requirements unchanged. Post-archive verification: section 6 no longer lists the non-goal. ✅
- **`openspec/config.yaml`** test baseline refreshed: "12 test files (246 tests passing)" → "13 test files (254 tests passing)" (was WARNING-3 in verify-report; resolved at archive).

## Warnings (documentation-level, non-blocking)

1. `apply-progress` memory artifact title says "12/12 tasks" while `tasks.md` shows 15/15 — `tasks.md` is authoritative; all 15 checked in the archived artifact.
2. TDD Cycle Evidence table in `apply-progress` covers only PR 2 rows; PR 1 (1.1–2.4) rows lack per-task RED/GREEN columns in the merged artifact. Test files exist and pass — evidence documentation gap, not a test gap.
3. `openspec/config.yaml` baseline was stale at verify time — refreshed to 13/254 as part of this archive (now closed).

## Known Non-CRITICAL Issues (from verify-report, open)

**SUGGESTION** level, carried forward for future work:
1. UI form has no `end >= start` validation; `countCommercialDays` silently returns 0 for reversed dates, showing a 0-day result without explanation. Add a field-level hint/warning.
2. No linter configured (no eslint script) — consider adding for CI quality gate.
3. Coverage tooling absent — adding `@vitest/coverage-v8` would strengthen future strict-TDD verifications.

## Archive Contents

- `proposal.md` ✅
- `exploration.md` ✅
- `specs/legal/spec.md` ✅ (delta spec)
- `design.md` ✅
- `tasks.md` ✅ (15/15 tasks complete, 0 unchecked)
- `verify-report.md` ✅ (validated version, sha256 `1b7217c…`)

Active change directory `openspec/changes/liquidacion-basica/` removed. Source of truth updated: `openspec/specs/legal/spec.md` (non-goal removal) and `openspec/config.yaml` (baseline refresh).

## SDD Cycle

Complete: planned, implemented, verified, reviewed (native SDD DONE/APPROVED), and archived. Ready for the next change (e.g., Módulo 2 indemnización Art. 64, Módulo 3 suspensión Art. 51/53, or the end>=start UI validation suggestion).
