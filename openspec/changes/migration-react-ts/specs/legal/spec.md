# Delta: Legal & Payroll Spec — Platform Migration Only

## Change

`migration-react-ts` — Migrate Nómina Clara from vanilla JS to React + TypeScript + Vite.

## Impact on Requirements

**Zero spec-level changes.** This is a platform migration only — all existing requirements in `openspec/specs/legal/spec.md` remain valid and unchanged.

| Section | Status | Notes |
|---------|--------|-------|
| 1. Legal Rates Module | Unchanged | Module source moves from `tarifas-legales.js` → `src/lib/rates.ts`. Same pure data, same exported functions. |
| 2. Calculator | Unchanged | Same formulas, same validation rules, same concept categories. UI migrates from `calculadora.js` + `index.html` to React components under `CalculatorPage/`. |
| 3. Storage | Unchanged | Same localStorage schema, same operations. Module moves from `storage.js` → `src/lib/storage.ts`. |
| 4. Import/Export | Unchanged | Same file format, same validation. Module moves from `import-export.js` → `src/lib/importExport.ts`. |
| 5. Scenarios | Unchanged | All 7 scenarios (happy path, minimum wage, OT limits, underpaid, overpaid, empty, print) test identically. |
| 6. Non-Goals | Unchanged | Still no backend, no auth, no withholding. |

## Deprecation Notes

The following source files are **removed** by this migration (their behavior lives on in typed modules):

| Removed File | Replaced By |
|---|---|
| `js/tarifas-legales.js` | `src/lib/rates.ts` |
| `js/storage.js` | `src/lib/storage.ts` |
| `js/import-export.js` | `src/lib/importExport.ts` |
| `js/calculadora.js` | `src/components/CalculatorPage/` |
| `js/comparativa.js` | `src/components/ComparePage/` |
| `index.html` | Vite `index.html` + React SPA |
| `comparar.html` | Route `/compare` |

## Verification

- All `calculateBreakdown()` scenarios MUST produce identical results after migration (tested via migrated Vitest unit tests).
- Calculator and compare pages MUST render with same data and visual output.
- Canvas charts MUST render identically (same drawing code, same output).
- `vite build` MUST succeed with zero TypeScript errors in strict mode.
- `vitest run` MUST pass with ≥80% coverage on business logic modules.
