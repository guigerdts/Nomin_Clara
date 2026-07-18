# Nómina Clara — Change Proposal

## Intent

Build a local-first web application ("Nómina Clara") for calculating and comparing biweekly payroll payments in Colombia. The primary goal is detecting whether night surcharges, overtime, and holiday premiums are being paid correctly per Colombian labor law (Ley 2466/2025, effective July 2026).

## Scope

### In Scope

1. **Personal calculator** (index.html): Form-based payroll calculator for a single worker
   - Input: monthly salary, transportation allowance eligibility, hours by category (day OT, night OT, holiday OT, night surcharge, holiday surcharge)
   - Output: per-concept breakdown with hourly rate, surcharge %, subtotal, and grand total
   - Comparison: field for "what they actually paid you" with visual diff alert
   - Storage: save records to localStorage by biweekly period
   - Export/import: download personal JSON, import peer JSON for comparison
   - Print: optimized print view via `@media print`

2. **Peer comparison view** (comparar.html):
   - Import one or more JSON files from coworkers
   - Comparative table: name, salary, total OT, received vs. calculated, difference, compliance %
   - Sort/filter by largest negative difference
   - Simple bar chart (Canvas API or Chart.js CDN)
   - Print comparison report

3. **Legal rates module** (js/tarifas-legales.js):
   - All Colombian labor cost multipliers in a single, well-commented, replaceable file
   - Rates: 42h work week, night surcharge 35%, OT day 25%, OT night 75%, holiday ordinary 90%, holiday night combined 125%, holiday OT day 215%, holiday OT night 265%
   - Hard cap enforcement: max 2 OT hours/day, 12 OT hours/week with user warning

4. **History & evolution**:
   - Saved biweekly records in localStorage
   - Evolution chart over time (Canvas API, no external libs)

5. **Design**:
   - SaaS-style responsive UI (mobile-first, works on phones)
   - Sidebar/navbar, cards with soft shadows, clear typography
   - Green accent for "paid correctly", red for "discrepancy detected"
   - Dark mode toggle
   - Legal tooltips explaining each surcharge with CST/Law 2466 references

### Out of Scope

- No backend server or database
- No user authentication or login
- No real-time data fetching
- No PDF generation (print via browser only)
- No multi-language support beyond Spanish UI
- No integration with Colombian government systems (Dian, Ministerio de Trabajo)

## Approach

### Architecture

Client-only SPA. All logic runs in the browser. Data persists in localStorage. File exchange uses JSON import/export.

```
index.html          → Personal calculator
comparar.html       → Peer comparison view
css/styles.css      → All styles (responsive, dark mode, print)
js/tarifas-legales.js   → Legal rates & multipliers (single source of truth)
js/calculadora.js       → Calculation engine
js/storage.js           → localStorage read/write/query
js/import-export.js     → JSON file import/export logic
```

### Data Flow

1. User fills form → calculadora.js computes breakdown → renders to DOM
2. User saves → storage.js persists to localStorage with timestamp
3. User exports → import-export.js serializes localStorage → downloads .json
4. Peer imports .json → comparar.html loads multiple records → renders table + chart

### Key Decisions

- **Vanilla JS only**: Zero framework dependencies. No npm, no build step.
- **Legal rates as data, not logic**: `tarifas-legales.js` exports a `RATES` object. All multipliers are data constants with legislative references in comments. Updating rates means editing one file.
- **Progressive enhancement**: Works without JS? No — this is a calculator. Graceful degradation not required.
- **Mobile-first responsive**: Grid/flexbox layout, no horizontal scroll on phones.
- **Dark mode**: CSS custom properties + class toggle on `<html>`.

## Business Rules (Colombian Labor Law)

### Work Day
- Legal work week: **42 hours** (Ley 2466/2025)
- Daily hours: 42 / 6 = **7 hours/day** (Monday–Saturday)
- Day period: 6:00–19:00
- Night period: 19:00–6:00

### Hourly Rate
- Ordinary hour value = (Monthly salary ÷ 30) ÷ (42 ÷ 6) = (salary ÷ 30) ÷ 7

### Surcharges & Multipliers

| Concept | Multiplier | Legal Reference |
|---|---|---|
| Night surcharge (recargo nocturno) | ×1.35 (+35%) | CST Art. 168, Ley 2466 |
| Day overtime (hora extra diurna) | ×1.25 (+25%) | CST Art. 179 |
| Night overtime (hora extra nocturna) | ×1.75 (+75%) | CST Art. 179, Ley 2466 |
| Holiday/Sunday ordinary (recargo festivo) | ×1.90 (+90%) | CST Art. 179 |
| Holiday + night combined | ×2.25 (+125%) | CST Art. 168, 179 |
| Holiday day overtime | ×2.15 (+215%) | CST Art. 179, Ley 2466 |
| Holiday night overtime | ×2.65 (+265%) | CST Art. 179, Ley 2466 |

### Caps
- Max 2 overtime hours per day
- Max 12 overtime hours per week
- If exceeded, show warning but still calculate (informational, not blocking)

## Risks

| Risk | Mitigation |
|---|---|
| Legal rates may change with new laws | Isolated in one file with comment header; easy to audit and update |
| User enters invalid data | Client-side validation with clear error messages |
| localStorage limits (~5-10MB) | Each record is <1KB; history of years fits comfortably |
| Browser compatibility | Targets modern browsers (Chrome, Firefox, Safari, Edge recent versions) |
| Calculation errors affect real pay | All formulas are documented and traceable; comparison vs actual pay field provides check |

## Next Steps

1. Write detailed spec with Given/When/Then scenarios
2. Design component tree and data model
3. Break into implementation tasks
4. Implement in order: tarifas-legales.js → calculadora.js → index.html → storage.js → import-export.js → styles.css → comparar.html
