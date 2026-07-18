# Nómina Clara — Archive Report

**Archived**: 2026-07-18
**Status**: Archived with known non-CRITICAL issues (see Pending section)
**Archive location**: `openspec/changes/archive/2026-07-18-nomina-clara/`

---

## What Was Built

A local-first, client-only web application ("Nómina Clara") for calculating and comparing biweekly payroll payments in Colombia, detecting whether night surcharges, overtime, and holiday premiums are paid correctly per Colombian labor law (Ley 2466/2025).

### Delivered Artifacts

| File | Purpose |
|------|---------|
| `index.html` | Personal biweekly payroll calculator form with real-time calculation, comparison to actual pay, history view, and export/import |
| `comparar.html` | Peer comparison view — import JSON from coworkers, comparison table, bar chart, sorting/filtering |
| `css/styles.css` | Full responsive CSS: light/dark theme, mobile-first, print styles, green/red alerts |
| `js/tarifas-legales.js` | Legal rates — single source-of-truth data file with all Colombian labor multipliers (42h/week, surcharges, OT limits), helper functions (hourly value, transport allowance, COP formatting, OT validation, breakdown calculation) |
| `js/calculadora.js` | UI controller — form binding, validation, calculation orchestration, comparison logic |
| `js/storage.js` | localStorage CRUD wrapper — save, read, delete, export/import records by ID with corruption handling |
| `js/import-export.js` | JSON file I/O via File API: export Blob download, import with validation, toast feedback |

### Completed Tasks

All 11/11 tasks completed across two PR groups:

**Group A — Legal Engine + Calculator** (~1200 lines, first PR):
- A.1: `tarifas-legales.js` — rates, multipliers, helpers
- A.2: `calculadora.js` — form binding, validation, orchestration
- A.3: `storage.js` — localStorage CRUD
- A.4: `import-export.js` — JSON file operations
- A.5: `index.html` — calculator page
- A.6: `css/styles.css` — base styles, responsive, dark, print

**Group B — Comparison View + Polish** (~800 lines, second PR):
- B.1: `comparar.html` — comparison page
- B.2: Canvas bar charts (evolution + comparison)
- B.3: Comparativa logic (sort/filter/aggregate)
- B.4: History evolution chart on index.html
- B.5: Legal tooltips, error handling, polish

---

## What Was Changed

### Architecture Decisions Implemented

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Separate legal rates file: all multipliers in `tarifas-legales.js` with legislative references | ✅ Implemented |
| ADR-002 | No framework, no build step: vanilla JS, CSS custom properties, HTML5 | ✅ Implemented |
| ADR-003 | Two-page architecture: `index.html` + `comparar.html` | ✅ Implemented |

### Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| legal | Created (full spec copy) | `openspec/specs/legal/spec.md` — complete legal & payroll delta spec. No existing main spec to merge; this IS the main spec. |

### Source of Truth Updated

- `openspec/specs/legal/spec.md` — now reflects the legal rates, calculator, storage, and import/export behavior

### Archived Contents

- `proposal.md` ✅ — Intent, scope, approach, business rules, risks
- `specs/legal/spec.md` ✅ — Full delta spec with requirements and Given/When/Then scenarios
- `design.md` ✅ — Technical design: architecture, module design, data model, component tree, CSS architecture, flow diagrams, ADRs
- `tasks.md` ✅ — 11/11 tasks complete
- `verify-report.md` ✅ — Verification results with issues log
- `archive-report.md` ✅ — This document

---

## What Remains Pending

The verification report identified the following issues. None are CRITICAL; archive proceeds per policy.

### HIGH Severity

| # | Issue | Description |
|---|-------|-------------|
| 1 | Grand total formula deviation (§2.5) | Implementation uses full multiplier (×1.25) instead of surcharge-only (×0.25) as originally spec'd. Recommended: update spec to clarify that overtime uses full multiplier (since OT hours are not covered by base pay) while ordinary-hour surcharges use (multiplier−1). |
| 2 | Missing concept #6 — "Recargo nocturno + festivo combinado" (§2.3) | No form field or calculation for HOLIDAY_NIGHT (×2.25). Needs: form input field in `index.html`, `addConcept` call in `calculateBreakdown`. |

### MEDIUM Severity

| # | Issue | Description |
|---|-------|-------------|
| 3 | No inline validation errors (§2.8) | When salary ≤ 0, results hide silently — no inline error message next to field. |
| 4 | Export empty state (§4.1) | Export doesn't check for empty records before downloading; no "No hay registros" message. |

### LOW Severity

| # | Issue | Description |
|---|-------|-------------|
| 5 | COP formatting lacks decimals (§2.1) | Displayed as whole pesos; spec says 2 decimal places. |
| 6 | Night surcharge double-count (§2.5) | Night surcharge on ordinary hours (covered by base pay) includes base hour value. |

### Recommended Next Steps

1. **Fix formula deviation** (issue #1): Update the spec to clarify the formula per actual Colombian payroll practice — OT concepts use full multiplier, ordinary-hour surcharges use (multiplier−1)
2. **Add concept #6** (issue #2): Add form field + calculation for holiday night ordinary hours
3. **Add inline validation** (issue #3): Show error messages next to invalid fields
4. **Fix export empty state** (issue #4): Guard export with empty-check
5. **Polish** (issues #5, #6): Format and formula edge-case refinements

These fixes are suitable for a follow-up SDD change.

---

## Audit Trail

- Change proposal: `openspec/changes/archive/2026-07-18-nomina-clara/proposal.md`
- Specs: `openspec/changes/archive/2026-07-18-nomina-clara/specs/`
- Design: `openspec/changes/archive/2026-07-18-nomina-clara/design.md`
- Tasks: `openspec/changes/archive/2026-07-18-nomina-clara/tasks.md`
- Verify report: `openspec/changes/archive/2026-07-18-nomina-clara/verify-report.md`
- Main spec (source of truth): `openspec/specs/legal/spec.md`
