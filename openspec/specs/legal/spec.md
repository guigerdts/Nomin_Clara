# Nómina Clara — Legal & Payroll Spec

## Purpose

This spec covers the legal rates module and the biweekly payroll calculator for individual workers — rates data, per-concept calculation, storage, import/export, and their scenarios.
## Requirements
### Requirement: Rate data structure

The module MUST export a frozen constant object `RATES` containing all legal multipliers, limits, and reference values as pure data:

```javascript
RATES = {
  WEEKLY_HOURS: 42,
  DAILY_HOURS: 7,
  DAY_START: 6,   // 6:00
  DAY_END: 19,    // 19:00
  SURCHARGES: {
    NIGHT: 0.35,
    OT_DAY: 0.25,
    OT_NIGHT: 0.75,
    HOLIDAY: 0.90,
    HOLIDAY_NIGHT: 1.25,
    HOLIDAY_OT_DAY: 1.15,  // 215% total => 115% surcharge over base
    HOLIDAY_OT_NIGHT: 1.65  // 265% total => 165% surcharge over base
  },
  MULTIPLIERS: {
    NIGHT: 1.35,
    OT_DAY: 1.25,
    OT_NIGHT: 1.75,
    HOLIDAY: 1.90,
    HOLIDAY_NIGHT: 2.25,
    HOLIDAY_OT_DAY: 2.15,
    HOLIDAY_OT_NIGHT: 2.65
  },
  LIMITS: {
    MAX_OT_PER_DAY: 2,
    MAX_OT_PER_WEEK: 12
  },
  TRANSPORT_ALLOWANCE_MULTIPLIER: 2, // applies if salary <= 2 SMMLV
  TRANSPORT_ALLOWANCE_VALUE: 200000  // monthly COP, reference 2026
}
```

#### Scenario: RATES exports the frozen legal constants
- **WHEN** the module is imported
- **THEN** `RATES` is a frozen constant object with the weekly 42 hours, daily 7 hours, 6:00–19:00 day window, the full surcharge/multiplier maps, OT limits (2/day, 12/week), and the transport-allowance multiplier (2 SMMLV) and value ($200.000, reference 2026)

### Requirement: Comments and legal references

Each rate MUST include a comment with the legal concept name in Spanish, the specific surcharge percentage, and a reference to Código Sustantivo del Trabajo and/or Ley 2466/2025 article.

#### Scenario: Every rate carries its Spanish concept and citation
- **WHEN** inspecting a rate entry in `RATES`
- **THEN** its comment states the Spanish concept name, the percentage, and the CST and/or Ley 2466/2025 article reference

### Requirement: Helper functions

The module SHOULD export the following helpers, and each exported helper MUST return its documented type: `getOrdinaryHourValue(monthlySalary)` → hourly rate in COP; `getTransportAllowance(monthlySalary)` → 0 or reference value based on the 2 SMMLV threshold; `formatCOP(value)` → Colombian peso string ($XXX.XXX); `validateOTLimits(dayOT, nightOT, holidayDayOT, holidayNightOT)` → `{ valid: boolean, warnings: string[] }`; `calculateBreakdown(entries, monthlySalary)` → array of concept breakdowns and grand total.

#### Scenario: Helpers are exported with the documented signatures
- **WHEN** the module is imported
- **THEN** the ordinary-hour, transport-allowance, COP-format, OT-limit validation, and breakdown helpers are exported with their documented signatures and return types

### Requirement: Maintainability

The file header MUST contain: file purpose, last updated date, legal basis note, clear instructions on how to update rates when laws change, and the SMMLV (minimum wage) value as a constant at the top.

#### Scenario: Header documents purpose, date, and update instructions
- **WHEN** opening the rates file
- **THEN** the header shows the file purpose, last updated date, legal basis note, update instructions, and the SMMLV constant at the top

### Requirement: Hourly rate computation

The calculator MUST compute the ordinary hour value from a monthly salary: `value = (salary ÷ 30) ÷ (42 ÷ 6)`. The result SHALL be displayed in COP format with 2 decimal places.

#### Scenario: Ordinary hour value from monthly salary
- **WHEN** computing the ordinary hour value from a monthly salary
- **THEN** value = (salary ÷ 30) ÷ (42 ÷ 6) and the result is displayed in COP format with 2 decimal places

### Requirement: Per-concept calculation

For each hour category, the calculator SHALL compute `concept_total = hours × ordinary_hour_value × multiplier`. The breakdown SHALL include: concept name (Spanish), hours, ordinary hour value, surcharge %, multiplier, subtotal.

#### Scenario: Concept total uses hours, hour value, and multiplier
- **WHEN** computing any hour category
- **THEN** concept_total = hours × ordinary_hour_value × multiplier and the breakdown row shows name, hours, hour value, surcharge %, multiplier, and subtotal

### Requirement: Concept categories in display order

The breakdown SHALL list, in order: 1. Salario base (15 días × DAILY_HOURS = 105 horas por quincena), 2. Recargo nocturno, 3. Hora extra diurna, 4. Hora extra nocturna, 5. Recargo dominical/festivo, 6. Recargo nocturno + festivo combinado, 7. Hora extra diurna dominical/festiva, 8. Hora extra nocturna dominical/festiva, 9. Auxilio de transporte (si aplica).

#### Scenario: Only base and transport allowance with no extras
- **WHEN** no overtime or surcharge hours are entered and the total is computed
- **THEN** only base salary (proportional to the quincena) and transportation allowance are displayed

### Requirement: Base pay for the quincena

The calculator MUST compute base pay as `salary ÷ 2`, and this SHALL be the starting amount before adding surcharges and overtime.

#### Scenario: Biweekly base pay
- **WHEN** computing the biweekly base pay from a monthly salary
- **THEN** base pay = salary ÷ 2 and it is the starting amount before surcharges and overtime

### Requirement: Grand total

The calculator MUST compute `TOTAL = base_pay + auxilio_transporte + Σ(concept_additional)` where: `base_pay = salary ÷ 2` covers 105 ordinary hours (7h/día × 15 días); for **recargos sobre horas ordinarias** (nocturno, festivo): `additional = hours × hour_value × (multiplier − 1)` — only the surplus, because basePay already covers the base hour; for **horas extra** (OT day, OT night, holiday OT day, holiday OT night): `additional = hours × hour_value × multiplier` — full value, because those are additional hours NOT covered by basePay.

| Concepto | Tipo | Fórmula adicional |
|---|---|---|
| Recargo nocturno (×1.35) | Recargo ordinario | hours × hour_value × 0.35 |
| Recargo dom/festivo (×1.90) | Recargo ordinario | hours × hour_value × 0.90 |
| Recargo nocturno + festivo (×2.25) | Recargo ordinario | hours × hour_value × 1.25 |
| Hora extra diurna (×1.25) | Hora extra | hours × hour_value × 1.25 |
| Hora extra nocturna (×1.75) | Hora extra | hours × hour_value × 1.75 |
| Hora extra diurna dom/fest (×2.15) | Hora extra | hours × hour_value × 2.15 |
| Hora extra nocturna dom/fest (×2.65) | Hora extra | hours × hour_value × 2.65 |

The GRAND TOTAL displayed SHALL be base_pay + auxilio + all additional amounts.

#### Scenario: Grand total sums base, auxilio, and additions
- **WHEN** the total is computed
- **THEN** the grand total equals base_pay + auxilio + all additional amounts per the recargo (multiplier − 1) and hora extra (multiplier) rules above

### Requirement: Comparison with actual pay

When the user enters the "amount actually paid" and the calculated total differs, the system MUST SHOW a color-coded difference: difference = 0 or positive → green ("Al día" or "Te pagaron más de lo calculado"); difference negative → red ("Te deben $XXX.XXX").

#### Scenario: Underpaid shows red alert
- **WHEN** the calculated total differs and the difference is negative
- **THEN** a red alert shows "Te deben $XXX.XXX"

#### Scenario: Al día or overpaid shows green
- **WHEN** the difference is 0 or positive
- **THEN** a green status shows "Al día" or "Te pagaron más de lo calculado"

### Requirement: Validation rules

The calculator SHALL validate: monthly salary > 0 (MUST); all hour inputs are non-negative numbers (MUST); OT limits — max 2 per day per category, max 12 total OT hours per week (SHOULD warn); transportation allowance auto-toggle based on the 2 SMMLV threshold (MUST).

#### Scenario: OT limit warnings are informational
- **WHEN** a user enters 3 day OT hours + 11 night OT hours
- **THEN** the warning "Has excedido el límite de 2 horas extra/día en horas extra diurnas" and the warning "Has excedido el límite de 12 horas extra/semana" are shown and the total is still calculated (informational only)

### Requirement: Error states

On invalid input (negative hours, zero salary), when the user clicks "Calcular" the system MUST show an inline validation error next to the offending field and MUST NOT render results.

#### Scenario: Invalid input blocks results with inline error
- **WHEN** invalid input (negative hours, zero salary) is submitted via "Calcular"
- **THEN** an inline validation error appears next to the offending field and no results are rendered

### Requirement: Storage schema

The storage module MUST persist records under localStorage key `nomina-clara-records` as a JSON array of record objects:

```javascript
{
  id: "2026-07-15-unique-id",
  alias: "Mi alias",
  date: "2026-07-01",      // first day of the quincena
  salary: 2600000,
  transportAllowance: 200000,
  entries: { /* hours by category from the form */ },
  breakdown: [ /* per-concept results */ ],
  totalCalculated: 3850000,
  totalActual: 3800000,    // user input, can be null
  difference: -50000,
  createdAt: "2026-07-18T12:00:00Z",
  mode?: 'manual' | 'schedule',           // input mode (optional — 'manual' default)
  scheduleProfile?: ScheduleProfile,       // present when mode='schedule'
  workedDays?: WorkedDay[]                 // present when mode='schedule'
}
```

#### Scenario: Records persist under the documented key and shape
- **WHEN** a record is saved
- **THEN** it is stored in `nomina-clara-records` with the documented fields, including optional `mode`, `scheduleProfile`, and `workedDays` when present

### Requirement: Storage operations

The module SHALL export: `saveRecord(record)` → appends to the array; `getAllRecords()` → sorted array (newest first); `getRecord(id)` → single record by ID; `deleteRecord(id)` → removes from storage; `exportAllData()` → full JSON string of all records; `importRecords(jsonString)` → merges and deduplicates by ID; `clearAllRecords()` → removes the key (SHOULD confirm first).

#### Scenario: CRUD and import/export helpers are exported
- **WHEN** the storage module is imported
- **THEN** save, list (newest first), get-by-id, delete, export-all, import-with-dedupe, and clear (with confirmation) operations are available with the documented behavior

### Requirement: Storage error handling

On localStorage quota exceeded, the module MUST catch the error and show a user-friendly message. On corrupted JSON, it MUST return an empty array and log a warning to the console.

#### Scenario: Quota errors surface a friendly message
- **WHEN** localStorage quota is exceeded on save
- **THEN** the error is caught and a user-friendly message is shown

#### Scenario: Corrupted JSON degrades to an empty array
- **WHEN** the stored JSON is corrupted
- **THEN** an empty array is returned and a warning is logged to the console

### Requirement: Export

When the user clicks "Exportar mis datos" and records exist, the system MUST generate a `.json` file download with all records named `nomina-clara-{alias}-{YYYY-MM-DD}.json`. When no records exist, it MUST show "No hay registros guardados para exportar".

#### Scenario: Export with records downloads a named JSON file
- **WHEN** the user clicks "Exportar mis datos" and records exist
- **THEN** a `.json` file download with all records is generated and named `nomina-clara-{alias}-{YYYY-MM-DD}.json`

#### Scenario: Export with no records shows a message
- **WHEN** the user clicks "Exportar mis datos" and no records exist
- **THEN** the message "No hay registros guardados para exportar" is shown

### Requirement: Import

When the user selects a `.json` file via the file input and it loads, the system MUST validate the JSON structure, merge it via `storage.importRecords()`, and show a success count. On invalid JSON or missing required fields, it MUST show "El archivo no tiene el formato esperado" and MUST NOT modify stored data.

#### Scenario: Valid import merges and reports count
- **WHEN** the user selects a valid `.json` file and it loads
- **THEN** the JSON is validated, merged into localStorage via `storage.importRecords()`, and a success count is shown

#### Scenario: Invalid import is rejected without data changes
- **WHEN** the imported JSON is invalid or missing required fields
- **THEN** the error "El archivo no tiene el formato esperado" is shown and stored data is not modified

### Requirement: End-to-end scenarios

The calculator SHALL satisfy the following end-to-end scenarios.

#### Scenario: Happy path — full OT
- **WHEN** a user earns $2.600.000/month, worked 4 day OT hours, 2 night hours (not OT), 2 night OT hours, and the quincena had no holidays
- **THEN** base pay of $1.300.000 is shown, the OT breakdown uses the correct multipliers, the grand total is greater than base pay, and the transportation allowance is auto-disabled (salary > 2 SMMLV)

#### Scenario: Minimum wage
- **WHEN** a user earns $1.423.500/month (2026 SMMLV approx) and worked 4 day OT hours
- **THEN** the transportation allowance auto-applies and the total reflects both OT and the transport allowance

#### Scenario: OT limit warning
- **WHEN** a user enters 3 day OT hours + 11 night OT hours and the calculator validates
- **THEN** both the 2-hours-per-day and 12-hours-per-week warnings are shown and the total is still calculated (informational only)

#### Scenario: Comparison — underpaid
- **WHEN** the calculated total is $2.500.000 and the user enters an actual pay of $2.300.000
- **THEN** a red alert shows "Te deben $200.000"

#### Scenario: Comparison — overpaid
- **WHEN** the calculated total is $2.500.000 and the user enters an actual pay of $2.600.000
- **THEN** a green alert shows "Te pagaron $100.000 más de lo calculado"

#### Scenario: Empty state
- **WHEN** the user opens the page for the first time
- **THEN** an empty form with all fields at 0 is shown and no results are displayed until "Calcular" is clicked

#### Scenario: Print view
- **WHEN** the user has a calculation result visible and selects File → Print or clicks "Imprimir"
- **THEN** `@media print` hides buttons, nav, and form controls, and only the breakdown table, totals, and header are shown

### Requirement: Educational block — "Conocé tus derechos laborales"

The system MUST render a second collapsible `<details>` block inside `GlosarioRecargos`, below the existing surcharge section, titled "Conocé tus derechos laborales", containing three prose sections: (1) obligatory rest and compensatory day, (2) legal maximum working hours, (3) how to claim discrepancies. Each section MUST include its precise legal citations.

#### Scenario: Rights block renders below the surcharge glossary
- **WHEN** the glossary card renders
- **THEN** a second independently-collapsible block titled "Conocé tus derechos laborales" appears below the surcharge section with the three content sections

#### Scenario: Surcharge glossary remains independently collapsible
- **WHEN** the rights block is open or closed
- **THEN** the existing surcharge section toggles independently and is unaffected

### Requirement: Rest and compensatory day content (CST Arts. 172–176, 179–180, Ley 2466/2025)

The system MUST explain the weekly rest day (in principle Sunday, Arts. 172–173 CST), the right to a compensatory day when worked on the obligatory rest day, and the applicable citations including Ley 2466/2025 where relevant.

#### Scenario: Rest section shows obligatory day and compensatory right
- **WHEN** the rights block's first section renders
- **THEN** it explains the weekly rest right, the compensatory-day right when the rest day is worked, and cites CST Arts. 172–176 and 179–180

### Requirement: Maximum working hours content (CST Art. 161, Decreto 2352/1965 Art. 22, Ley 2101/2021, Ley 2466/2025)

The system MUST explain the legal maximum working hours and their evolution — CST Art. 161, Decreto 2352/1965 Art. 22, Ley 2101/2021 (42-hour week), Ley 2466/2025 — in plain language with the citations.

#### Scenario: Jornada section shows maximum hours with citations
- **WHEN** the rights block's second section renders
- **THEN** it states the legal maximum week and cites CST Art. 161, Decreto 2352/1965 Art. 22, Ley 2101/2021 and Ley 2466/2025

### Requirement: Claim process content (written complaint → Ministry → lawsuit)

The system MUST explain, as a step list, how to claim discrepancies: formal written complaint to the employer, then the Ministry of Labor, then a labor lawsuit.

#### Scenario: Claim section renders a three-step path
- **WHEN** the rights block's third section renders
- **THEN** it lists the complaint path in order: written complaint, Ministry of Labor, labor lawsuit

### Requirement: Official links footer with safe new-tab behavior

The system MUST render an official-links footer with the exact official URLs (SUIN CST, SUIN Ley 2466/2025, Función Pública consolidated version), each opening in a new tab with `target="_blank"` and `rel="noopener noreferrer"`.

#### Scenario: Official links open safely in new tabs
- **WHEN** a worker clicks an official link in the links footer
- **THEN** the link opens in a new tab with `rel="noopener noreferrer"` and points to the official SUIN or Función Pública URL

### Requirement: Educational disclaimer

The system MUST show an educational disclaimer ("contenido educativo, no asesoría legal" in the app's voice) below the links footer, and MUST NOT present any section as legal advice.

#### Scenario: Disclaimer renders below links
- **WHEN** the rights block renders
- **THEN** the educational disclaimer is visible below the links footer

## Non-Goals

- No server-side calculation
- No user authentication
- No multi-language support
- No payroll withholding (health, pension, solidarity fund) calculations
