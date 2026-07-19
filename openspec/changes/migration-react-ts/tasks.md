# Tasks: Migrate Nómina Clara to React + TypeScript + Vite

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~930 (PR1: ~300, PR2: ~380, PR3: ~250) |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Scaffold + pure modules + hooks + Toast | PR 1 | `npx vitest run src/lib/` | N/A — pure logic, no browser dep | Revert PR commit; old app untouched |
| 2 | CalculatorPage with Canvas chart | PR 2 | `npx vitest run src/pages/CalculatorPage/` | `npx vite dev` — fill form, verify results | Revert PR commit; PR1 scaffold survives |
| 3 | ComparePage + delete old files | PR 3 | `npx vitest run` | `npx vite dev` — import mock JSON, sort table | Revert PR commit; `git restore` recovers deletions |

## Phase 1: Scaffold & Pure Logic (PR1)

- [x] 1.1 Scaffold Vite project: `package.json`, `tsconfig.json` (strict), `vite.config.ts`, `index.html` with inline theme script
- [x] 1.2 Create `src/lib/types.ts` — shared interfaces (`PayrollInput`, `BreakdownResult`, `SavedRecord`)
- [x] 1.3 Extract `src/lib/rates.ts` — typed `calculateBreakdown()`, `validateOTLimits()`, `formatCOP()`
- [x] 1.4 Extract `src/lib/storage.ts` — typed localStorage CRUD for saved records
- [x] 1.5 Extract `src/lib/importExport.ts` — JSON file download/upload helpers
- [x] 1.6 Create `src/hooks/useLocalStorage.ts` — generic localStorage state hook
- [x] 1.7 Create `src/hooks/useTheme.ts` — theme toggle synced with inline `<script>`
- [x] 1.8 Create `src/components/Toast.tsx` — portal-based toast notification
- [x] 1.9 Create `vercel.json` — SPA rewrites: `/*` → `/index.html`
- [x] 1.10 Write Vitest unit tests: rates scenarios, storage CRUD, import/export, formatCOP edges

## Phase 2: Calculator Page (PR2)

- [x] 2.1 Create `src/styles/global.css` — CSS custom properties, reset, `@media print`
- [x] 2.2 Create `src/components/Header.tsx` — nav links, brand, ThemeToggle button
- [x] 2.3 Create `src/components/Footer.tsx` — legal disclaimer
- [x] 2.4 Create `src/App.tsx` — BrowserRouter with routes `/` and `/compare`
- [x] 2.5 Create `src/main.tsx` — React entry point
- [x] 2.6 Create `PayrollForm.tsx` — salary, alias, 7 concept inputs, transporte toggle
- [x] 2.7 Create `ResultsCard.tsx` + `BreakdownTable.tsx` + `TotalsPanel.tsx` + `ActualPayComparison.tsx`
- [x] 2.8 Create `HistorySection.tsx` + `HistoryTable.tsx` — latest 10 records from localStorage
- [x] 2.9 Create `EvolutionChart.tsx` — Canvas chart via `useRef`/`useEffect`
- [x] 2.10 Create `ActionButtons.tsx` — save, export, print, clear
- [x] 2.11 Create CSS Modules (`.module.css`) for each component
- [x] 2.12 Write RTL integration tests: form → calculate → render, history save/load

## Phase 3: Compare Page & Cleanup (PR3)

- [ ] 3.1 Create `ImportSection.tsx` — file input + JSON import with validation
- [ ] 3.2 Create `ComparisonChart.tsx` — Canvas chart via `useRef`/`useEffect`
- [ ] 3.3 Create `ComparisonTable.tsx` — sortable records table
- [ ] 3.4 Create CSS Modules for compare components
- [ ] 3.5 Add route `/compare` in `App.tsx`
- [ ] 3.6 Write RTL integration tests: import mock data, toggle sort
- [ ] 3.7 Delete old files: `js/`, `css/`, `index.html`, `comparar.html`
- [ ] 3.8 Update `README.md` with new stack and build commands
