# Design: Migrate Nómina Clara to React + TypeScript + Vite

## Technical Approach

Page-by-page migration in 3 chained PRs. Extract pure business logic first (`rates.ts`, `storage.ts`, `importExport.ts`) with TypeScript types and Vitest tests. Rebuild DOM-heavy pages as React components preserving existing Canvas 2D chart code and CSS custom properties. Deletion of old files only in PR3.

## Architecture Decisions

### Stack & Tooling
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Vite | Fast HMR, native ESM, Vitest-ready | ✅ **Vite** |
| React 18 + TS strict | Catches null/undefined at compile time — critical for payroll math | ✅ **strict: true** |
| CSS Modules | Scoped, zero runtime, reuses `var(--color-*)` tokens | ✅ **CSS Modules** — global theme vars stay in `global.css` |
| Tailwind / CSS-in-JS | New dependency, rewrites 795 lines of proven CSS | ❌ |
| Canvas `useRef` | Wraps existing drawing code, pixel-identical output | ✅ **Canvas refs** — only 2 charts, no new dep |
| Recharts | Adds 30KB+, would rewrite working chart logic | ❌ |
| React Router v6 | Declarative, 2 routes, standard SPA router | ✅ **react-router-dom** |
| HashRouter | No server config needed | ❌ Prefer BrowserRouter + Vite SPA fallback |

### Theme FOUC
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline `<script>` in `<head>` | Runs before React hydration, zero flicker | ✅ **Inline script** — reads localStorage, sets `data-theme` |
| React `useEffect` | Theme applied after mount → visible flash | ❌ |

## Component Tree

```
App (BrowserRouter)
├── Header (NavLink /, NavLink /compare, ThemeToggle, brand)
├── Routes
│   ├── "/" → CalculatorPage
│   │   ├── PayrollForm (salary, alias, 7 concept inputs, transporte)
│   │   ├── OTWarnings (conditional alert)
│   │   ├── ResultsCard
│   │   │   ├── BreakdownTable
│   │   │   ├── TotalsPanel
│   │   │   └── ActualPayComparison
│   │   ├── HistorySection
│   │   │   ├── EvolutionChart (Canvas, useRef/useEffect)
│   │   │   └── HistoryTable (latest 10 records)
│   │   └── ActionButtons (save, export, print, clear)
│   └── "/compare" → ComparePage
│       ├── ImportSection (file input + import)
│       └── ComparisonSection
│           ├── ComparisonChart (Canvas, useRef/useEffect)
│           └── ComparisonTable (sortable)
├── Footer (legal disclaimer)
└── ToastContainer (portal, fixed bottom-right)
```

## Data Flow

```
Form state ──→ calculateBreakdown() ──→ BreakdownResult ──→ ResultsCard
     │               │                         │
     │        validateOTLimits()          localStorage (save/load)
     │                                     File I/O (export/import)
     └───────── useLocalStorage hook ──────┘
```

State is component-local (`useState`) + `useLocalStorage` hook for persistence. No global store — no cross-component shared state beyond localStorage reads.

## File Changes

| File | Action |
|------|--------|
| `src/lib/rates.ts` | Create — typed rates + `calculateBreakdown()` |
| `src/lib/storage.ts` | Create — typed localStorage CRUD |
| `src/lib/importExport.ts` | Create — File I/O, JSON download/upload |
| `src/lib/types.ts` | Create — shared interfaces |
| `src/hooks/useLocalStorage.ts` | Create — generic localStorage hook |
| `src/hooks/useTheme.ts` | Create — theme state + inline-script sync |
| `src/components/Header.tsx` | Create |
| `src/components/Toast.tsx` | Create — portal toast |
| `src/pages/CalculatorPage/` (8 files) | Create — form, results, history, chart |
| `src/pages/ComparePage/` (4 files) | Create — import, table, chart |
| `src/styles/global.css` | Create — theme vars + reset + print |
| `src/styles/*.module.css` | Create — per-component styles |
| `index.html` (root) | Modify — Vite entry + inline theme script |
| `vite.config.ts` | Create |
| `tsconfig.json` | Create |
| `package.json` | Create |
| `vercel.json` | Create — SPA rewrites: `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}` |
| `js/*.js` (5 files) | Delete in PR3 |
| `css/styles.css` | Delete in PR3 |
| `index.html` (old) | Delete in PR3 |
| `comparar.html` | Delete in PR3 |

## Interfaces / Contracts

```typescript
interface PayrollInput {
  salary: number; alias?: string;
  dayOT: number; nightOT: number;
  holidayDayOT: number; holidayNightOT: number;
  nightSurcharge: number; holidaySurcharge: number;
  holidayNightSurcharge: number;
}

interface BreakdownEntry {
  label: string; hours: number; hourValue: number;
  surchargePct: number; multiplier: number;
  subtotal: number; surchargeOnly: number; legalRef: string;
}

interface BreakdownResult {
  basePay: number; transport: number; hourValue: number;
  entries: BreakdownEntry[]; extraTotal: number; grandTotal: number;
  salary: number; totalOT: number; totalSurchargeHours: number;
}

interface SavedRecord {
  id: string; createdAt: string; alias: string;
  quincena: string; salary: number; transportAllowance: number;
  inputs: PayrollInput; breakdown: BreakdownEntry[];
  totalCalculated: number; totalActual: number | null;
  totalOT: number; difference: number | null;
}
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `calculateBreakdown()` | Vitest — exact COP outputs for all 7 spec scenarios |
| Unit | `validateOTLimits()` | Boundary tests per category |
| Unit | `storage.ts` | Mocked localStorage, test CRUD + import/export |
| Unit | `formatCOP()` | Edge: 0, NaN, null, large COP values |
| Integration | Form → calculate → render | RTL — fill form, verify displayed numbers |
| Integration | History + localStorage | RTL — save record, verify table row |
| Integration | ComparePage import + sort | RTL — import mock data, toggle sort |
| E2E | Full calculator flow | Manual (Playwright optional) |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

**PR1** (~300 lines): Scaffold Vite project, extract `src/lib/rates.ts`, `storage.ts`, `importExport.ts`, types, hooks, Toast, unit tests. Old app untouched — verifiable via `vitest run`.

**PR2** (~380 lines): Build `CalculatorPage/` with all sub-components and CSS Modules. Integrate Canvas chart via `useRef`/`useEffect`. App usable at this point.

**PR3** (~250 lines): Build `ComparePage/` with import, chart, sortable table. Delete `js/`, `css/`, `index.html`, `comparar.html`. Final CSS cleanup.

Rollback per PR — revert commit. Old files survive until PR3; `git restore` recovers deletions.

## Open Questions

- [ ] `useLocalStorage` — schema validation on read vs. current try/catch?
- [ ] Canvas resize debouncing — `useEffect` cleanup with ResizeObserver vs. window event listener?
