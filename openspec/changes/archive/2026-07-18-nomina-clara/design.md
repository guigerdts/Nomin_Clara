# Nómina Clara — Technical Design

## Architecture Overview

Client-only SPA with two HTML entry points sharing common CSS and JS modules.

```
┌─────────────────────────────────────────────────────┐
│                   Entry Points                       │
│  index.html (calculator)   comparar.html (compare)   │
└──────────┬──────────────────────────┬────────────────┘
           │                          │
┌──────────▼──────────────────────────▼────────────────┐
│                 Shared CSS Layer                      │
│              css/styles.css (global)                  │
│              @media (print) / dark mode               │
└──────────┬──────────────────────────┬────────────────┘
           │                          │
┌──────────▼──────────────────────────▼────────────────┐
│                 JS Modules                            │
│  ┌──────────────────┐  ┌────────────────────────┐    │
│  │ tarifas-legales.js│  │    calculadora.js      │    │
│  │ (pure data +     │  │ (computation engine,   │    │
│  │  helpers)         │  │  pure functions)       │    │
│  └──────────────────┘  └────────────────────────┘    │
│  ┌──────────────────┐  ┌────────────────────────┐    │
│  │   storage.js      │  │   import-export.js     │    │
│  │ (localStorage     │  │ (JSON file I/O via     │    │
│  │  CRUD)            │  │  File API + download)  │    │
│  └──────────────────┘  └────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

## Module Design

### 1. `tarifas-legales.js` — Pure Data + Stateless Helpers

**Exports**: `RATES`, `getOrdinaryHourValue`, `getTransportAllowance`, `formatCOP`, `validateOTLimits`, `calculateBreakdown`

**Design decisions**:
- Single frozen `RATES` object as the source of truth for all multipliers
- Helper functions are pure: given inputs → return computed values, no side effects
- No DOM interaction, no event listeners
- All monetary values in COP (number), formatting only at display layer

**Dependencies**: none

**Key function — calculateBreakdown**:

```javascript
function calculateBreakdown({ salary, dayOT, nightOT, holidayDayOT, holidayNightOT, nightSurcharge, holidaySurcharge }) {
  const hourValue = getOrdinaryHourValue(salary);
  const transport = getTransportAllowance(salary);
  const basePay = salary / 2;

  const entries = [];
  let extraTotal = 0;

  // Helper to add a concept
  function addConcept(label, hours, multiplier, surchargePct) {
    if (hours <= 0) return;
    const subtotal = hours * hourValue * multiplier;
    const surchargeOnly = hours * hourValue * (multiplier - 1);
    entries.push({ label, hours, hourValue, surchargePct, multiplier, subtotal, surchargeOnly });
    extraTotal += surchargeOnly;
  }

  // Add concepts in order...
  // ...

  const grandTotal = basePay + transport + extraTotal;

  return { basePay, transport, hourValue, entries, extraTotal, grandTotal };
}
```

### 2. `calculadora.js` — UI Controller

**Responsibilities**: Form binding, validation, result rendering, event handling

**Design decisions**:
- Reads form inputs → calls `calculateBreakdown` from tarifas-legales.js
- Renders results into a `<div id="resultados">` as a table
- Handles the "comparison with actual pay" logic
- Manages the "Imprimir" button (triggers window.print)
- Two-way data binding: form change → recalculate

**Dependencies**: `tarifas-legales.js`

### 3. `storage.js` — Data Persistence

**Exports**: `saveRecord`, `getAllRecords`, `getRecord`, `deleteRecord`, `exportAllData`, `importRecords`, `clearAllRecords`

**Design decisions**:
- Thin wrapper over localStorage.getItem/setItem with JSON serialization
- IDs generated via `Date.now().toString(36) + Math.random().toString(36).slice(2)`
- importRecords deduplicates by record `id`
- Degrades gracefully: corrupted data → empty array + console.warn

**Dependencies**: none

### 4. `import-export.js` — File Operations

**Design decisions**:
- Export: creates a Blob from `storage.exportAllData()`, uses `URL.createObjectURL` + invisible `<a>` click
- Import: `<input type="file" accept=".json">`, reads via FileReader, validates JSON shape, calls `storage.importRecords`
- Cross-page data sharing: both index.html and comparar.html include import-export.js

**Dependencies**: `storage.js`

## Data Model

### localStorage Key

```
Key: "nomina-clara-records"
Value: Record[]
```

### Record Schema

```typescript
interface Record {
  id: string;                // unique ID (timestamp + random)
  alias: string;             // user's name/alias
  quincena: string;          // ISO date of quincena start (e.g., "2026-07-01")
  createdAt: string;         // ISO datetime of save
  salary: number;            // monthly salary in COP
  transportAllowance: number; // 0 or reference value
  inputs: {
    dayOT: number;
    nightOT: number;
    holidayDayOT: number;
    holidayNightOT: number;
    nightSurcharge: number;
    holidaySurcharge: number;
  };
  breakdown: Array<{
    label: string;
    hours: number;
    hourValue: number;
    surchargePct: number;
    multiplier: number;
    subtotal: number;
  }>;
  totalCalculated: number;
  totalActual: number | null;
  difference: number;
}
```

## Component Tree (DOM Structure)

### index.html

```
#app
├── header
│   ├── h1 "Nómina Clara"
│   ├── dark-mode-toggle
│   └── nav-links (Calculadora | Comparar)
├── main
│   ├── .card#form-card
│   │   ├── h2 "Tus datos"
│   │   ├── form#calculadora-form
│   │   │   ├── .field-group (salario)
│   │   │   ├── .field-group (transporte - auto toggle display)
│   │   │   ├── .field-group (alias)
│   │   │   ├── .field-group (horas extra diurnas)
│   │   │   ├── .field-group (horas extra nocturnas)
│   │   │   ├── .field-group (recargo nocturno)
│   │   │   ├── .field-group (extra diurna festiva)
│   │   │   ├── .field-group (extra nocturna festiva)
│   │   │   ├── .field-group (recargo festivo)
│   │   │   └── .ot-warning (conditional, hidden by default)
│   │   └── .form-actions (Calcular, Limpiar)
│   ├── .card#results-card (hidden until first calculation)
│   │   ├── h2 "Desglose de pago"
│   │   ├── table#breakdown-table
│   │   ├── .grand-total
│   │   ├── .comparison-section
│   │   │   ├── input "¿Cuánto te pagaron realmente?"
│   │   │   └── .difference-alert (red/green)
│   │   └── .result-actions (Guardar, Exportar, Imprimir)
│   └── .card#history-card
│       ├── h2 "Historial"
│       ├── canvas#evolution-chart
│       └── .history-list
└── footer
    ├── legal-disclaimer
    └── version
```

### comparar.html

```
#app
├── header (shared)
├── main
│   ├── .card#import-card
│   │   ├── h2 "Importar datos de compañeros"
│   │   └── file-input + import-button
│   ├── .card#comparison-card
│   │   ├── h2 "Comparativa"
│   │   ├── .comparison-controls (sort/filter)
│   │   ├── canvas#comparison-chart
│   │   └── table#comparison-table
│   └── .result-actions (Imprimir reporte)
└── footer
```

## CSS Architecture

### Design Tokens (CSS Custom Properties)

```css
:root {
  /* Colors - Light */
  --color-bg: #f5f7fa;
  --color-surface: #ffffff;
  --color-text: #1a1a2e;
  --color-text-secondary: #6b7280;
  --color-accent-green: #10b981;
  --color-accent-green-bg: #d1fae5;
  --color-accent-red: #ef4444;
  --color-accent-red-bg: #fee2e2;
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-border: #e5e7eb;
  --color-card-shadow: rgba(0, 0, 0, 0.05);
  /* Spacing */
  --radius: 8px;
  --radius-lg: 12px;
  --shadow: 0 1px 3px var(--color-card-shadow);
  --shadow-lg: 0 4px 12px var(--color-card-shadow);
  /* Typography */
  --font: 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', monospace;
}

[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #e2e8f0;
  --color-text-secondary: #94a3b8;
  --color-border: #334155;
  --color-card-shadow: rgba(0, 0, 0, 0.3);
}
```

### Layout
- One-column mobile, wider main content on desktop
- Cards stack vertically with consistent gap
- Sidebar/nav as a sticky top bar on mobile, horizontal nav on desktop

### Responsive Breakpoints
- Mobile: < 640px (single column, full-width cards)
- Tablet: 640–1024px (2-column grid for cards)
- Desktop: > 1024px (max-width container centered)

### Print Styles (@media print)
- Hide nav, buttons, form controls, alerts
- Show only breakdown table, totals header, and footer disclaimer
- Black and white, no shadows

## Flow Diagrams

### Calculator Flow

```
User enters data → "Calcular" click or input change
  ↓
calculadora.js reads DOM values
  ↓
Calls tarifas-legales.validateOTLimits()
  ├── warnings? → show .ot-warning banner
  ↓
Calls tarifas-legales.calculateBreakdown(inputs)
  ↓
Renders breakdown table
  ↓
Renders grand total
  ↓
If "actual pay" field has value → compute difference → show alert
  ↓
"Guardar" → storage.js saves to localStorage → updates history card

### Comparison Flow (comparar.html)
User selects .json file → FileReader → parse JSON
  ↓
Validate structure → storage.importRecords() → localStorage
  ↓
Read all records from storage → group by alias → compute averages
  ↓
Render comparison table + chart
  ↓
Sort/filter controls update table order
```

## Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Chart rendering | Canvas API native | Zero dependencies, no CDN needed, sufficient for bar charts |
| CSS methodology | Custom properties + BEM-lite | No preprocessor needed, runtime theme switching |
| Icons | Unicode/emoji or simple SVG inline | No icon library dependency |
| JS modules | ES6 modules via `<script type="module">` or IIFE pattern | Static file serving, no bundler |
| Dark mode | `data-theme` attribute on `<html>` | Instant switch, persisted to localStorage |
| Form validation | Constraint Validation API + custom JS | Native browser validation + custom rules |

## Architecture Decisions

### ADR-001: Separate legal rates file
**Status**: Accepted
**Context**: Colombian labor law changes frequently. The app must adapt quickly.
**Decision**: All multipliers, limits, and reference values live in a single pure-data file (`tarifas-legales.js`) with legislative references in comments. The calculation engine reads from this file; it never hardcodes rates.
**Consequence**: Updating rates is a single-file edit. Requires re-testing all scenarios.

### ADR-002: No framework, no build step
**Status**: Accepted
**Context**: The app must work by opening HTML files directly or serving with a simple HTTP server. Audience includes people on phones with no dev tooling.
**Decision**: Zero dependencies. Vanilla JS, CSS custom properties, HTML5. No npm, no import maps, no bundler.
**Consequence**: More manual DOM manipulation. No component reusability. But maximum portability.

### ADR-003: Two-page architecture vs SPA
**Status**: Accepted
**Context**: Calculator and comparison views serve different user journeys.
**Decision**: Two separate HTML files (index.html, comparar.html). Shared JS/CSS files loaded by both.
**Consequence**: Duplicate header/nav HTML between pages. But simpler mental model, and each page can be bookmarked independently.

## Open Questions

None resolved. All design decisions are captured in ADRs above.
