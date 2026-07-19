# Proposal: Migrate Nómina Clara from Vanilla JS to React + TypeScript + Vite

## Intent

Migrate the static 2-page HTML/JS app to a component-based SPA (React 18+ / TypeScript strict / Vite) while preserving all existing functionality. The business logic (legal rates, storage, calculations) is pure and proven — this is a platform migration, not a rewrite.

## Scope

### In Scope
- PR1 (scaffold): Vite + React + TS setup, pure module extraction (`rates.ts`, `storage.ts`, `importExport.ts`), hooks (`useLocalStorage`, `useTheme`), Toast component, unit tests
- PR2 (calculator): Calculator page — form, results, history, Canvas chart (via `useRef`/`useEffect`), CSS Modules, integration tests
- PR3 (compare): Compare page — import, aggregation, chart, sort controls. Delete old files (`index.html`, `comparar.html`, `js/`, old CSS)

### Out of Scope
- No backend, no auth, no multi-language
- No UI framework (keep existing CSS custom properties)
- No Recharts — wrap existing Canvas 2D drawing in React refs
- No print-layout changes (must preserve existing `@media print`)
- No new payroll features (no withholding, no severance)

## Capabilities

### New Capabilities
None — no new behavior is introduced. Existing spec (`openspec/specs/legal/spec.md`) remains valid.

### Modified Capabilities
None — requirements are unchanged. This is a platform migration, not a spec-level change.

## Approach

Page-by-page migration in 3 chained PRs (each ≤400 lines):
1. **PR1** (~300 lines): Scaffold project, extract pure modules (zero DOM), add TypeScript types, write unit tests for business logic. Independently verifiable via `vitest`.
2. **PR2** (~380 lines): Build CalculatorPage replacing `calculadora.js` + `index.html`. All components, Canvas chart via `useRef`, CSS Modules. App is already usable.
3. **PR3** (~250 lines): Build ComparePage replacing `comparativa.js` + `comparar.html`. Delete old files. Final CSS cleanup.

Charts use existing Canvas 2D logic wrapped in React `useRef`/`useEffect` — no library change. Theme init kept as inline `<script>` in `<head>` to prevent FOUC.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/tarifas-legales.js` | Removed | Extracted to `src/lib/rates.ts` (pure, typed) |
| `js/storage.js` | Removed | Extracted to `src/lib/storage.ts` (typed, same localStorage API) |
| `js/import-export.js` | Removed | Extracted to `src/lib/importExport.ts` (DOM deps → React patterns) |
| `js/calculadora.js` | Removed | Decomposed into React components under `CalculatorPage/` |
| `js/comparativa.js` | Removed | Decomposed into React components under `ComparePage/` |
| `index.html` | Removed | Replaced by Vite `index.html` + React router |
| `comparar.html` | Removed | Route `/compare` in React SPA |
| `css/styles.css` | Modified | Migrated to CSS Modules per component; shared theme vars preserved |
| `README.md` | Modified | Update to reflect new stack and build commands |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Chart visuals differ after Canvas ref wrap | Low | Keep same drawing code; snapshot test before/after |
| Print styles break with React rendering | Low | Test `@media print` before merging PR3 |
| FOUC on theme toggle | Low | Keep inline `<script>` in `<head>` before React mounts |
| XSS via `dangerouslySetInnerHTML` | Low | Ban `dangerouslySetInnerHTML` in lint rules; React auto-escapes by default |

## Rollback Plan

Per-PR rollback: revert the PR commit. Old HTML/JS files remain untouched until PR3 deletes them. At any point after PR1 or PR2, the old app still works from the git-previous state. PR3 deletion is the only irreversible step — if rollback needed, restore deleted files from git.

## Dependencies

- Node.js 18+ (required for Vite)
- npm packages: react, react-dom, react-router-dom, typescript, vite, vitest, @testing-library/react

## Success Criteria

- [ ] All existing `calculateBreakdown()` scenarios produce identical results (tested via migrated unit tests)
- [ ] Both calculator and compare pages render with same data and visual output as old app
- [ ] Canvas charts render identically (same drawing code, same output)
- [ ] `vite build` succeeds with zero TypeScript errors (strict mode)
- [ ] `vitest run` passes with ≥80% coverage on business logic modules
- [ ] Old HTML/JS files fully removed after PR3
