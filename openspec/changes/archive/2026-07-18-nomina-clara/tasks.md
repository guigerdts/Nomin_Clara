# Nómina Clara — Implementation Tasks

## Review Workload Forecast

- **Estimated changed lines**: ~2500 (6 files, 2 HTML pages, ~400 lines CSS, ~400 lines JS total)
- **400-line budget risk**: High — well over 400 lines
- **Chained PRs recommended**: Yes — split into at least 2 PRs
- **Decision needed before apply**: Yes — confirm PR splitting strategy

## Task Groups

### Group A: Legal Engine + Calculator (first PR — ~1200 lines)

| ID | Task | Dependencies | Est. Lines | Files | Status |
|---|---|---|---|---|---|
| A.1 | Create `tarifas-legales.js` with all rates, multipliers, helpers | None | 120 | js/tarifas-legales.js | ✅ |
| A.2 | Create `calculadora.js` — form binding, validation, calculation orchestration | A.1 | 200 | js/calculadora.js | ✅ |
| A.3 | Create `storage.js` — localStorage CRUD wrapper | None | 100 | js/storage.js | ✅ |
| A.4 | Create `import-export.js` — JSON file operations | A.3 | 100 | js/import-export.js | ✅ |
| A.5 | Build `index.html` — calculator page structure | A.1, A.2, A.3, A.4 | 200 | index.html | ✅ |
| A.6 | Create `css/styles.css` — base styles, layout, cards, responsive, dark mode, print | A.5 | 400 | css/styles.css | ✅ |

### Group B: Comparison View + Polish (second PR — ~800 lines)

| ID | Task | Dependencies | Est. Lines | Files | Status |
|---|---|---|---|---|---|
| B.1 | Build `comparar.html` — comparison page structure | A.3, A.4, A.6 | 250 | comparar.html | ✅ |
| B.2 | Implement chart rendering (Canvas API) for evolution + comparison | A.5, B.1 | 150 | js/calculadora.js, js/chart-helper.js | ✅ |
| B.3 | Add comparison table, sorting/filtering logic | B.1 | 200 | js/comparativa.js | ✅ |
| B.4 | Add history evolution chart to index.html | A.5 | 100 | js/calculadora.js | ✅ |
| B.5 | Legal tooltips, final error handling, edge case polish | A.5, B.1 | 100 | All | ✅ |

## Detailed Task Specifications

- [x] ### A.1 — tarifas-legales.js

**File**: `js/tarifas-legales.js`

**Requirements**:
- Frozen `RATES` constant with all multipliers (see specs/legal/spec.md §1.1)
- Functions: `getOrdinaryHourValue`, `getTransportAllowance`, `formatCOP`, `validateOTLimits`, `calculateBreakdown`
- SMMLV constant at top (`const SMMLV = 1423500;` — 2026 reference, commented as updatable)
- Each rate has Spanish concept name, %, and legal reference in comment
- `calculateBreakdown` returns `{ basePay, transport, hourValue, entries[], extraTotal, grandTotal }`

**Acceptance**: Unit-testable via browser console. `getOrdinaryHourValue(2600000)` returns `12380.95...`

- [x] ### A.2 — calculadora.js

**File**: `js/calculadora.js`

**Requirements**:
- On DOMContentLoaded: bind form fields, add event listeners
- On "Calcular" click or input change: read all field values, validate, call calculateBreakdown
- Render breakdown table and grand total
- Handle "actual pay" comparison with color-coded difference
- Handle "Limpiar" to reset form
- OT limit warnings rendered as banner above calculate button
- Transportation allowance auto-toggle based on salary
- Recalculate on any input change (real-time preview)

**Acceptance**: Fill form with $2.600.000 salary, 4 day OT hours → see breakdown with correct multipliers

- [x] ### A.3 — storage.js

**File**: `js/storage.js`

**Requirements**:
- localStorage key: `nomina-clara-records`
- `saveRecord(record)` → generate ID with `Date.now().toString(36) + crypto.randomUUID().slice(0,8)`, add createdAt, prepend to array, save
- `getAllRecords()` → parse JSON, sort by createdAt DESC, handle corrupted JSON
- `exportAllData()` → `JSON.stringify(allRecords, null, 2)`
- `importRecords(jsonString)` → parse, merge by ID (skip duplicates), persist
- `deleteRecord(id)` → filter out, save
- `clearAllRecords()` → remove key

**Acceptance**: `saveRecord({...})`, then `getAllRecords()` returns array with the saved record.

- [x] ### A.4 — import-export.js

**File**: `js/import-export.js`

**Requirements**:
- Export: Button triggers `<a download>` with blob URL, filename `nomina-clara-{alias}-{date}.json`
- Import: `<input type="file">` reads file, validates top-level shape (isArray, has required fields), calls `storage.importRecords`
- Shows success/error toast messages
- Debounced: prevent double import

**Acceptance**: Click export → downloads valid JSON. Import that same JSON → records appear.

- [x] ### A.5 — index.html

**File**: `index.html` (root)

**Requirements**:
- Semantic HTML5 structure as outlined in design.md component tree
- Loads all JS files (order: tarifas-legales.js, calculadora.js, storage.js, import-export.js)
- Form fields match the spec: salary, transport toggle, alias, 6 hour-type inputs
- Results card initially hidden (display:none), shown after first calculation
- History section with canvas for evolution chart, below results
- Nav link to comparar.html
- All input IDs, data attributes consistent with what calculadora.js expects

**Acceptance**: Opens in browser, form visible, no console errors. All fields present.

- [x] ### A.6 — css/styles.css

**File**: `css/styles.css`

**Requirements**:
- CSS custom properties for theming (light + dark)
- Cards with shadow, rounded corners
- Responsive grid: 1 column mobile, wider on desktop
- Sidebar/nav as top bar
- Green/red alerts for payment comparison
- `@media print` hiding controls, buttons, nav
- Dark mode with `[data-theme="dark"]` selectors
- Smooth transitions for theme switch
- Form field styling (labels, inputs, validation states)

**Acceptance**: Mobile-first layout, responsive at 640px/1024px breakpoints. Dark mode toggles cleanly.

- [x] ### B.1 — comparar.html

**File**: `comparar.html`

**Requirements**:
- Import section with file input + import button
- Comparison table: columns for alias, salary, total OT hours, total calculated, total actual, difference, compliance %
- Sort controls: by name, by difference (asc/desc), by compliance %
- Canvas bar chart showing each person's compliance % or difference
- Import progress indicator
- "Imprimir reporte" button with @media print

**Acceptance**: Import 2+ JSON files → table populates with correct math. Sort by worst difference works.

- [x] ### B.2 — Chart rendering

**Files**: inline in comparar.html (canvas) + js for index.html history chart

**Requirements**:
- Canvas bar chart, no external libraries
- Bars colored green (positive diff) / red (negative diff)
- Labels for each bar (alias or quincena date)
- Y-axis auto-scales to data range
- Responsive: chart re-renders on window resize

**Acceptance**: After data loaded, chart renders with correct bar heights proportional to values.

- [x] ### B.3 — Comparativa logic

**File**: inline in comparar.html or separate js/comparativa.js

**Requirements**:
- Load all records from storage + imported records for non-self aliases
- Aggregate by alias: average salary, total extra hours, average compliance %
- Sort/filter functions that re-render table

**Acceptance**: Sorting by worst compliance puts most underpaid person first.

- [x] ### B.4 — History chart on index.html

**Requirements**:
- Canvas below history section
- Load all records for current alias
- Line or bar chart showing `totalCalculated` per quincena
- Also overlay `totalActual` if available

- [x] ### B.5 — Polish

**Requirements**:
- Tooltip for each form field explaining the surcharge with legal reference
- Loading states for import/export
- Keyboard navigation support (tab through form)
- Final error edge cases (non-numeric input, extreme values)
- Last check of all @media print styles