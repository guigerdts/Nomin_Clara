## Exploration: Migrate Nómina Clara from Vanilla JS to React + TypeScript + Vite

### Current State

**Architecture**: Static multi-page web app (2 HTML pages) with no framework, no bundler, no backend. Scripts are loaded via `<script src="...">` tags in dependency order. State is managed inline via DOM references (`getElementById`) and `localStorage`.

**Codebase size**: ~2,000 lines of JS across 5 files + 795 lines CSS + 520 lines HTML. Zero tests.

**File layering** (load order = dependency order):

| File | Lines | DOM? | Purpose |
|------|-------|------|---------|
| `tarifas-legales.js` | 364 | **No** — completely pure | Legal rates (SMMLV, multipliers), `calculateBreakdown()`, `formatCOP()`, `validateOTLimits()` |
| `storage.js` | 158 | **No** — only localStorage API | CRUD for payroll records, import/export helpers |
| `import-export.js` | 185 | **Partial** — `showToast()` creates DOM, `downloadBlob()` creates anchor elements | File I/O: JSON download, multi-file import with FileReader |
| `calculadora.js` | 514 | **Heavy** — every element by ID, event handlers, innerHTML rendering, Canvas 2D chart | Calculator page controller — event wiring, validation, render-breakdown, render-history, render-chart |
| `comparativa.js` | 307 | **Heavy** — same pattern | Compare page controller — file import, aggregation, sort, canvas chart |
| `styles.css` | 795 | CSS custom properties | Theming (light/dark via `[data-theme]`), responsive (640/1024 breakpoints), print styles |

**Key detail**: `calculateBreakdown()` in `tarifas-legales.js` is a 142-line pure function doing ALL the math (base salary, 7 concept types, transport allowance, grand total). Zero DOM dependency — ideal first extraction candidate.

**Duplicated code** to consolidate:
- `escapeHtml()` appears in both `calculadora.js` and `comparativa.js`
- Theme toggle inline script duplicated across both HTML files
- Canvas chart setup code (~80 lines each) with nearly identical patterns

### Affected Areas

- `/index.html` (287 lines) — Full calculator page → becomes `<CalculatorPage>` component
- `/comparar.html` (233 lines) — Full compare page → becomes `<ComparePage>` component  
- `/js/tarifas-legales.js` (364 lines) — Extract to `/src/lib/rates.ts` (pure, unchanged logic)
- `/js/storage.js` (158 lines) — Extract to `/src/lib/storage.ts` (add TypeScript types)
- `/js/import-export.js` (185 lines) — Extract to `/src/lib/importExport.ts` (replace DOM helpers with React patterns)
- `/js/calculadora.js` (514 lines) — Decompose into 8-12 React components
- `/js/comparativa.js` (307 lines) — Decompose into 4-6 React components
- `/css/styles.css` (795 lines) — Migrate to CSS modules (or co-located CSS) preserving theme variables
- `/README.md` — Update to reflect new stack

### Approaches

1. **Big Bang Rewrite** — Single PR replacing the entire app
   - Pros: Clean cutover, no hybrid state, simplest mental model
   - Cons: ~1,000+ authored lines exceeds PR review budget; high risk of regression across 2 pages simultaneously; no incremental testing
   - Effort: High (but small codebase limits risk)
   - **Review risk**: HIGH — exceeds 400-line budget by 2-3x

2. **Page-by-Page Migration with Chained PRs** — 3 PRs: (1) scaffold + pure modules, (2) calculator page, (3) compare page
   - Pros: Each PR under 400 lines; each PR independently verifiable (PR1 has tests for business logic, PR2 exercises the main page, PR3 completes the secondary page); early feedback on architecture
   - Cons: Shared components (Header, Footer, theme) need to work from PR2 onward; need to maintain both old `comparar.html` and new React pages temporarily if done out-of-order
   - Effort: Medium — sequenced but each slice is small
   - **Review risk**: LOW — each PR stays under 400 lines

3. **Strangler Fig** — Serve new React pages alongside old HTML pages, migrate one route at a time
   - Pros: Old pages remain fully functional during migration
   - Cons: Shared modules (storage, import-export) would need dual-mode compatibility (both script-tag and module imports); awkward for a 2-page SPA with no backend router; overengineered for this codebase size
   - Effort: High — extra complexity for marginal safety gain
   - **Review risk**: MEDIUM — dual compatibility inflates each PR

### Component Tree Map

```
App
├── Header
│   ├── NavbarBrand
│   ├── NavLinks (Calculator | Compare)
│   └── ThemeToggle
├── CalculatorPage (/)
│   ├── PayrollForm
│   │   ├── SalaryField
│   │   ├── AliasField
│   │   ├── TransportDisplay (auto from salary)
│   │   └── HoursGrid
│   │       ├── ConceptField × 7 (day-ot, night-ot, holiday-day-ot, holiday-night-ot, night-surcharge, holiday-surcharge, holiday-night-surcharge)
│   ├── OTWarnings
│   ├── ResultsCard
│   │   ├── HourValueDisplay
│   │   ├── BreakdownTable
│   │   ├── TotalsPanel
│   │   └── ActualPayComparison
│   ├── HistorySection
│   │   ├── EvolutionChart (Canvas wrapper or Recharts)
│   │   └── HistoryTable
│   └── ActionButtons (Save | Export | Print | Clear)
├── ComparePage (/compare)
│   ├── ImportSection (file input + import button)
│   └── ComparisonSection
│       ├── SortControls
│       ├── ComparisonChart (Canvas wrapper or Recharts)
│       └── ComparisonTable
├── Footer
└── Toast (portal-based notification system)
```

### Pure Module Candidates (zero DOM, immediate extraction)

| Module | Functions | Lines | Priority |
|--------|-----------|-------|----------|
| `lib/rates.ts` | `getOrdinaryHourValue`, `getTransportAllowance`, `formatCOP`, `validateOTLimits`, `calculateBreakdown` + constants (SMMLV, RATES) | ~200 | P0 — data foundation |
| `lib/storage.ts` | `saveRecord`, `getAllRecords`, `getRecord`, `deleteRecord`, `exportAllData`, `importRecords`, `clearAllRecords` | ~120 | P0 — persistence |
| `lib/importExport.ts` | `downloadBlob`, `readFileAsText` (pure file I/O, no DOM) | ~40 | P1 — actions layer |
| `hooks/useLocalStorage.ts` | Generic React hook wrapping localStorage | ~30 | P0 — React pattern |
| `hooks/useTheme.ts` | Theme state + persistence + toggle | ~25 | P0 — shared |

### Recommendation

**Approach 2: Page-by-Page Migration with Chained PRs.**

The codebase is small enough that a big bang is technically feasible, but the 400-line review budget makes it a non-starter for a single PR. The chained approach gives us:

1. **PR 1 (~300 lines)**: Vite + React + TS scaffold, all pure module extraction (`rates.ts`, `storage.ts`, `formatCOP`), hooks (`useLocalStorage`, `useTheme`), Toast component, unit tests for business logic. This is independently verifiable — all calculations work via `vitest` without any UI.

2. **PR 2 (~380 lines)**: Calculator page with all components (form, results, history, chart), CSS modules, integration tests. The main use case is covered; the app is already usable.

3. **PR 3 (~250 lines)**: Compare page with import section, comparison components, chart. Delete `comparar.html` and old JS files. Final CSS cleanup.

This way each PR is reviewable in one sitting, each delivers real value independently, and we get early test coverage on the business-critical math.

**Alternative if user prefers speed over review discipline**: Big Bang with explicit acknowledgement of the 400-line overage. Accept as `size:exception`.

### Risks

- **Canvas charts**: Both pages render hand-rolled Canvas 2D bar charts. Migration path options: (a) wrap existing Canvas drawing in React refs (lowest risk), (b) replace with Recharts (cleaner but different rendering). If we use Recharts, the chart look will change — this is cosmetic but needs stakeholder buy-in.
- **Print styles** (`@media print`): React rendering can interfere with print CSS. Must test print output after migration.
- **Theme toggle**: Inline script runs before React mounts — there will be a flash of unstyled content (FOUC) if we move the theme initialization to React. Mitigation: keep a tiny inline `<script>` in `<head>` that reads `localStorage` and sets `data-theme` before React hydrates.
- **import-export.js DOM patterns**: `showToast()` and `downloadBlob()` need React equivalents. Toast → portal-based component. downloadBlob → URL.createObjectURL in an effect or click handler. Straightforward but must not be overlooked.
- **Duplicate `escapeHtml`**: Minor, but React's JSX auto-escapes, so this function becomes unnecessary in the new codebase. Risk: someone might still use `dangerouslySetInnerHTML` and reintroduce XSS vectors.

### Ready for Proposal

**Yes** — the exploration is complete. All code paths have been read. The orchestrator should proceed to `sdd-propose` with:
- Change name: `migration-react-ts`
- Recommended approach: page-by-page (3 chained PRs)
- Framework: React 18+ with TypeScript strict mode, Vite, CSS Modules, Vitest
- Chart library decision needed: hand-rolled Canvas refs vs Recharts
