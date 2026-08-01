# Archive Report: indemnizacion-despido

**Archived**: 2026-08-01
**Branch**: `indemnizacion/pr1-logica` (both PR work units landed on this single branch; see Warnings)
**Artifact store**: openspec (repo-local)
**Status**: success

## What Was Built

Indemnización por despido sin justa causa (Art. 64 CST) for the three contract types — término fijo, término indefinido, obra o labor — rendered as a new section below the prestaciones grid on the `/liquidacion` view, with an Art. 64 CST termination-qualifier gate, Art. 46 CST renewal notices, and an educational footnote.

- **Pure module** `src/lib/indemnizacion.ts`: `calculateIndemnizacionFijo/Obra/Indefinido` + `calculateIndemnizacion` aggregator emitting `ConceptLine[]` (concepto + fórmula + legalRef 'CST Art. 64'). Reuses `countCommercialDays`, `formatCOPExact`, `SMMLV` from existing libs; local `formatFormulaNumber` copy (D13); never rounds days (D6); salary-only base, never `getTransportAllowance` (D7); high-branch threshold derived from `SMMLV × 10` constant, never hardcoded.
- **Types** `IndemnizacionContractType`, `IndemnizacionInputs` union, `IndemnizacionNotice`, `IndemnizacionResult` added to `src/lib/types.ts`.
- **Section** `src/pages/LiquidacionPage/IndemnizacionSection.tsx` + `IndemnizacionSection.module.css`: gate radios (default "Despido sin justa causa"; the other three options show a visible warning and never calculate), per-type inputs, ConceptLine results + notices + total, static footnote; wired into `LiquidacionPage.tsx` below the grid, prestaciones untouched.
- **Contract rules**: fijo — `(salario ÷ 30) × díasRestantes` with commercial days; expired → 0 + note "contrato ya vencido"; Art. 46 CST notice always, HR advisory "verifícalo con RR.HH." at renewals ≥ 3. Indefinido — low branch 30 + 20/additional year proportional, high branch (≥ 10 SMMLV, exactly 10 included) 20 + 15. Obra — `max(days, 15)` floor, floor NOT applied when finished (0).

### Delivery
- Canonical spec `openspec/specs/indemnizacion-despido/spec.md` committed `774c9cd` (created as a full spec, not by delta merge).
- PR 1 (pure logic + tests) and PR 2 (UI section + tests) both landed on branch `indemnizacion/pr1-logica`; HEAD at archive `076c7d0`.

## Verification Evidence (Final State)

| Metric | Value |
|--------|-------|
| Test suite | 278/278 passing (15 files) — re-run fresh at 10:34, exit 0 |
| Requirements | 6/6 compliant |
| Scenarios | 16/16 compliant |
| Type check | `npx tsc --noEmit` exit 0 (strict) |
| Build | `npx vite build` exit 0 (2.84s); single pre-existing CSS minify warning about `zIndex` (baseline, out of scope — no zIndex in changed files) |
| Tasks | 14/14 complete (all `[x]` in archived `tasks.md`, 0 unchecked) |
| Findings | 0 CRITICAL / 2 WARNING / 2 SUGGESTION (see below) |
| Change test count | 32 change tests (indemnizacion.test.ts 14, IndemnizacionSection.test.tsx 9, LiquidacionPage.test.tsx 9) |

Evidence anchors: `verify-report.md` in this archive (verdict pass, 6/6 requirements, 16/16 scenarios, 14/14 tasks, TDD evidence 6/6). Suite count is final-state per the fresh 10:34 run, not the intermediate 05:08 run.

### Native SDD Review
DONE and APPROVED (reviewGate.result: allow — "approved receipt exactly matches authoritative native state and the current repository"; nextRecommended: archive; blockedReasons: []).
- Lineage: `review-a65134ae6fb77615`
- Terminal state: approved, generation 1, evidence outcome: passed, risk level: medium, lens: review-reliability
- Receipt: `.git/gentle-ai/review-transactions/v2/review-a65134ae6fb77615/review-receipt.json` (not moved or modified by this archive)

## Spec Sync Performed

**Domain `indemnizacion-despido` — Verified/No-op merge** (canonical already exists and is current):

The delta spec `specs/indemnizacion-despido/spec.md` declares all 6 requirements as **ADDED**. The canonical `openspec/specs/indemnizacion-despido/spec.md` (committed `774c9cd`) was created as a full spec containing the same 6 requirements; archive-time verification confirmed each delta requirement is present by name in the canonical. No duplication, no reformat: the canonical keeps its GIVEN|WHEN|THEN tables (consistent with `openspec/specs/liquidacion-basica/spec.md`), while the archived delta keeps its `#### Scenario:` blocks (16 scenarios, per the verification-time reformat). Requirement names verified present:

1. Termination qualifier gate (Art. 64 CST)
2. Término fijo (Art. 64 CST)
3. Término indefinido (Art. 64 CST)
4. Obra o labor (Art. 64 CST)
5. Salary base and output conventions
6. Educational content (Art. 46 CST, advisory)

- **`openspec/config.yaml`** test baseline refreshed: "14 test files (268 tests passing)" → "15 test files (278 tests passing)" (was WARNING-1 in verify-report; resolved at archive).

## Warnings (non-blocking)

1. **Delivery structure (open)**: Both PR work units (PR 1 pure logic + PR 2 UI) landed on a single branch `indemnizacion/pr1-logica` — the stacked-PR chain suggested in `tasks.md` was not preserved as separate branches. Content is correct; observation only.
2. **Config baseline (closed)**: `openspec/config.yaml` was stale at verify time (14 files / 268 tests); refreshed to 15 files / 278 tests as part of this archive (WARNING-1 resolved).

## Known Non-CRITICAL Issues (from verify-report, open)

**SUGGESTION** level, carried forward for future work:
1. No linter configured (no eslint script) — consider adding for a CI quality gate.
2. Coverage tooling absent — adding `@vitest/coverage-v8` would strengthen future strict-TDD verifications.

## Archive Contents

- `proposal.md` ✅
- `specs/indemnizacion-despido/spec.md` ✅ (delta spec, 16 scenario blocks)
- `design.md` ✅
- `tasks.md` ✅ (14/14 tasks complete, 0 unchecked)
- `verify-report.md` ✅ (verdict pass)
- `apply-progress.md` ✅

No `exploration.md` was produced for this change (not required). Active change directory `openspec/changes/indemnizacion-despido/` removed. Source of truth updated: canonical spec already in place (`openspec/specs/indemnizacion-despido/spec.md`) and `openspec/config.yaml` (baseline refresh).

## SDD Cycle

Complete: planned, implemented (strict TDD, RED→GREEN per task), verified (278/278, 16/16 scenarios, 6/6 requirements), reviewed (native SDD DONE/APPROVED, lineage `review-a65134ae6fb77615`), and archived. Ready for the next change.
