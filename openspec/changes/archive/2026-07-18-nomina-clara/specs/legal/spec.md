# Nómina Clara — Legal & Payroll Spec

## Scope

This delta spec covers the legal rates module and the biweekly payroll calculator for individual workers.

## 1. Legal Rates Module (`tarifas-legales.js`)

### 1.1 Rate Data Structure

The module MUST export a frozen constant object `RATES` containing all legal multipliers, limits, and reference values as pure data.

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

### 1.2 Comments & Legal References

Each rate MUST include a comment with:
- The legal concept name in Spanish
- The specific surcharge percentage
- Reference to Código Sustantivo del Trabajo and/or Ley 2466/2025 article

### 1.3 Helper Functions

Module SHOULD export:
- `getOrdinaryHourValue(monthlySalary)` → returns hourly rate in COP
- `getTransportAllowance(monthlySalary)` → returns 0 or reference value based on 2 SMMLV threshold
- `formatCOP(value)` → returns string formatted as Colombian pesos ($XXX.XXX)
- `validateOTLimits(dayOT, nightOT, holidayDayOT, holidayNightOT)` → returns `{ valid: boolean, warnings: string[] }`
- `calculateBreakdown(entries, monthlySalary)` → returns array of concept breakdowns and grand total

### 1.4 Maintainability

The file header MUST contain:
- File purpose
- Last updated date
- Legal basis note
- Clear instructions on how to update rates when laws change
- The SMMLV (minimum wage) value as a constant at the top

## 2. Calculator (`calculadora.js`)

### 2.1 Hourly Rate Computation

**GIVEN** a monthly salary
**WHEN** computing the ordinary hour value
**THEN** value = (salary ÷ 30) ÷ (42 ÷ 6)
**AND** the result SHALL be displayed in COP format with 2 decimal places

### 2.2 Per-Concept Calculation

For each hour category, the calculator SHALL compute:

```
concept_total = hours × ordinary_hour_value × multiplier
```

The breakdown SHALL include: concept name (Spanish), hours, ordinary hour value, surcharge %, multiplier, subtotal.

### 2.3 Concept Categories (in display order)

1. Salario base (base pay for ordinary hours: 15 days × DAILY_HOURS = 105 hours per quincena)
2. Recargo nocturno (night surcharge on ordinary hours)
3. Hora extra diurna
4. Hora extra nocturna
5. Recargo dominical/festivo (holiday ordinary hours surcharge)
6. Recargo nocturno + festivo combinado
7. Hora extra diurna dominical/festiva
8. Hora extra nocturna dominical/festiva
9. Auxilio de transporte (if applicable)

**GIVEN** no overtime or surcharge hours entered
**WHEN** computing total
**THEN** only base salary (proportional to quincena) and transportation allowance SHALL be displayed

### 2.4 Base Pay for the Quincena

**GIVEN** a monthly salary
**WHEN** computing the biweekly base pay
**THEN** base pay = salary ÷ 2
**AND** this SHALL be the starting amount before adding surcharges and overtime

### 2.5 Grand Total

```
TOTAL = base_pay + auxilio_transporte + Σ(concept_additional)
```

Where:
- `base_pay = salary ÷ 2` cubre 105 horas ordinarias (7h/día × 15 días)
- Para **recargos sobre horas ordinarias** (nocturno, festivo): `additional = hours × hour_value × (multiplier - 1)` — solo el excedente, porque basePay ya cubre la hora base
- Para **horas extra** (OT day, OT night, holiday OT day, holiday OT night): `additional = hours × hour_value × multiplier` — valor completo, porque son horas adicionales NO cubiertas por basePay

**Desglose:**

| Concepto | Tipo | Fórmula adicional |
|---|---|---|
| Recargo nocturno (×1.35) | Recargo ordinario | hours × hour_value × 0.35 |
| Recargo dom/festivo (×1.90) | Recargo ordinario | hours × hour_value × 0.90 |
| Recargo nocturno + festivo (×2.25) | Recargo ordinario | hours × hour_value × 1.25 |
| Hora extra diurna (×1.25) | Hora extra | hours × hour_value × 1.25 |
| Hora extra nocturna (×1.75) | Hora extra | hours × hour_value × 1.75 |
| Hora extra diurna dom/fest (×2.15) | Hora extra | hours × hour_value × 2.15 |
| Hora extra nocturna dom/fest (×2.65) | Hora extra | hours × hour_value × 2.65 |

The GRAND TOTAL displayed SHALL be: base_pay + auxilio + all additional amounts.

### 2.6 Comparison with Actual Pay

**GIVEN** the user enters "amount actually paid"
**WHEN** the calculated total differs
**THEN** SHOW a color-coded difference:
- Difference = 0 or positive → green ("Al día" or "Te pagaron más de lo calculado")
- Difference negative → red ("Te deben $XXX.XXX")

### 2.7 Validation Rules

The calculator SHALL validate:
- Monthly salary > 0 (MUST)
- All hour inputs are non-negative numbers (MUST)
- OT limits: max 2 per day per category, max 12 total OT hours per week (SHOULD warn)
- Transportation allowance auto-toggle based on 2 SMMLV threshold (MUST)

### 2.8 Error States

**GIVEN** invalid input (negative hours, zero salary)
**WHEN** user clicks "Calcular"
**THEN** show inline validation error next to the offending field
**AND** do NOT render results

## 3. Storage (`storage.js`)

### 3.1 localStorage Schema

Key: `nomina-clara-records`
Value: JSON array of record objects:

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
  createdAt: "2026-07-18T12:00:00Z"
}
```

### 3.2 Operations

The module SHALL export:
- `saveRecord(record)` → appends to array in localStorage
- `getAllRecords()` → returns sorted array (newest first)
- `getRecord(id)` → single record by ID
- `deleteRecord(id)` → removes from storage
- `exportAllData()` → returns full JSON string of all records
- `importRecords(jsonString)` → merges imported records into localStorage, deduplicates by ID
- `clearAllRecords()` → removes key (SHOULD confirm first)

### 3.3 Error Handling

- localStorage quota exceeded: catch error and show user-friendly message
- Corrupted JSON: return empty array and log warning to console

## 4. Import/Export (`import-export.js`)

### 4.1 Export

**GIVEN** user clicks "Exportar mis datos"
**WHEN** records exist
**THEN** generate a `.json` file download with all records
**AND** filename format: `nomina-clara-{alias}-{YYYY-MM-DD}.json`

**GIVEN** user clicks "Exportar mis datos"
**WHEN** no records exist
**THEN** show message "No hay registros guardados para exportar"

### 4.2 Import

**GIVEN** user selects a `.json` file via file input
**WHEN** the file is loaded
**THEN** validate JSON structure
**AND** merge into localStorage via storage.importRecords()
**AND** show success count

**GIVEN** the imported JSON is invalid or missing required fields
**WHEN** validation fails
**THEN** show error message "El archivo no tiene el formato esperado"
**AND** do NOT modify stored data

## 5. Scenarios

### 5.1 Happy Path — Full OT

**GIVEN** a user earns $2.600.000/month
**AND** worked: 4 day OT hours, 2 night hours (not OT), 2 night OT hours
**AND** the quincena had no holidays
**WHEN** calculating total
**THEN** show base pay of $1.300.000
**AND** show OT breakdown with correct multipliers
**AND** grand total > base pay
**AND** transportation allowance is auto-disabled (salary > 2 SMMLV)

### 5.2 Minimum Wage

**GIVEN** a user earns $1.423.500/month (2026 SMMLV approx)
**AND** worked 4 day OT hours
**WHEN** calculating
**THEN** transportation allowance auto-applies
**AND** total reflects both OT and transport allowance

### 5.3 OT Limit Warning

**GIVEN** a user enters 3 day OT hours + 11 night OT hours
**WHEN** validating
**THEN** show warning "Has excedido el límite de 2 horas extra/día en horas extra diurnas"
**AND** show warning "Has excedido el límite de 12 horas extra/semana"
**AND** still calculate the total (informational only)

### 5.4 Comparison — Underpaid

**GIVEN** calculated total is $2.500.000
**AND** user enters actual pay of $2.300.000
**WHEN** rendering comparison
**THEN** show red alert "Te deben $200.000"

### 5.5 Comparison — Overpaid

**GIVEN** calculated total is $2.500.000
**AND** user enters actual pay of $2.600.000
**WHEN** rendering comparison
**THEN** show green alert "Te pagaron $100.000 más de lo calculado"

### 5.6 Empty State

**GIVEN** user opens the page for the first time
**WHEN** rendering
**THEN** show empty form with all fields at 0
**AND** no results displayed until "Calcular" is clicked

### 5.7 Print View

**GIVEN** user has a calculation result visible
**WHEN** selecting File → Print or clicking "Imprimir"
**THEN** @media print hides buttons, nav, form controls
**AND** only shows the breakdown table, totals, and header

## 6. Non-Goals

- No server-side calculation
- No user authentication
- No multi-language support
- No payroll withholding (health, pension, solidarity fund) calculations
- No severance or vacation calculations
