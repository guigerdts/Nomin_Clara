# Liquidación Básica (Prestaciones Sociales) Specification

## Purpose

Computes statutory prestaciones owed at contract end — cesantías (Art. 249 CST), intereses (Ley 52/1975), prima (Art. 306 CST), vacaciones (Art. 186 CST) — each shown with formula (real inputs) and legal citation.

## Requirements

### Requirement: Días trabajados (commercial day count)

The system MUST count días trabajados commercially: full month = 30 days (360-day year), and a partial month MUST count its actual elapsed days (e.g., 15-ene→31-jul = 6 full months × 30 + 17 = 197 días; 01-ene→31-jul = 210). ALL day counts in this module MUST use commercial 30-day months for full months, without exception — including the semester overlap for prima. Rationale (audit note): the ÷360 and ÷720 divisors are only consistent under that assumption; calendar counts (01-ene→31-jul = 212) would diverge from Colombian payroll calculators — 210 is NOT a bug, and the semester split (180 + 30) MUST also sum to the total (210). The system MUST NOT "correct" any day count toward calendar days, as that would break internal consistency, and MUST NOT round a partial month up to a full month, as that would overstate what the employer owes.

#### Scenario: Full commercial year count
- **WHEN** start is 01-ene-2026 and end is 31-jul-2026
- **THEN** días trabajados is 210 (7 × 30)

#### Scenario: Full month boundaries inclusive
- **WHEN** start is 01-ene-2026 and end is 31-ene-2026
- **THEN** días trabajados is 30 (boundaries inclusive)

#### Scenario: Zero-day range
- **WHEN** start equals end
- **THEN** días trabajados is 0

### Requirement: Cesantías (Art. 249 CST)

The system MUST compute `cesantías = (salario + auxilio) × días ÷ 360`.

#### Scenario: Cesantías with base and commercial days
- **WHEN** salario is $1.750.905, auxilio is $249.095 (base $2.000.000) and días is 210
- **THEN** cesantías is $1.166.666,67 (2.000.000 × 210 ÷ 360)

#### Scenario: Cesantías with zero salary
- **WHEN** salario is 0
- **THEN** cesantías is 0

### Requirement: Intereses sobre cesantías (Ley 52/1975)

The system MUST compute `intereses = cesantías × 12% × (días ÷ 360)`.

#### Scenario: Intereses with cesantías and commercial days
- **WHEN** cesantías is $1.166.666,67 and días is 210
- **THEN** intereses is $81.666,67 (1.166.666,67 × 12% × 210 ÷ 360)

#### Scenario: Intereses with zero days
- **WHEN** cesantías is positive and días is 0
- **THEN** intereses is 0

### Requirement: Prima de servicios (Art. 306 CST)

The system MUST compute `prima = (salario + auxilio) × días del semestre en curso ÷ 360`. Semester MUST be auto-detected from END date (ene-jun → 1st; jul-dic → 2nd); days = worked days inside it, boundaries inclusive.

#### Scenario: Prima with current-semester overlap
- **WHEN** end is 31-jul-2026 with jul overlap = 30 días (1 mes comercial) and base $2.000.000
- **THEN** prima is $166.666,67 (2.000.000 × 30 ÷ 360)

#### Scenario: Prima only counts worked days in the end-date semester
- **WHEN** start is 01-ene-2026 and end is 30-jun-2026
- **THEN** only ene-jun worked days are counted (180 días commercial)

#### Scenario: Whole final semester counted
- **WHEN** start is 01-ene-2026 and end is 31-dic-2026
- **THEN** the jul-dic semester is used and the whole semester is counted (180 días commercial)

#### Scenario: No worked days in end-date semester
- **WHEN** there are no worked days in the end-date semester
- **THEN** prima is 0

#### Scenario: Period spanning two semesters shows a partial-semester warning
- **WHEN** the period spans two semesters (01-ene-2026 → 31-jul-2026) and the prima result renders
- **THEN** the warning "Esto es solo la prima del semestre en curso — si el semestre anterior no se pagó, agrégalo aparte" is shown AND the amount reflects only jul-dic days

### Requirement: Vacaciones (Art. 186 CST)

The system MUST compute `vacaciones = (salario SIN auxilio) × días ÷ 720 − días disfrutados`. The system MUST NOT clamp a negative net to $0 and MUST show a neutral warning (employer may deduct the excess at final liquidation — valid exception to Art. 149 CST).

#### Scenario: Vacaciones with base and commercial days
- **WHEN** salario is $1.750.905 (sin auxilio), días is 210 and disfrutados is 0
- **THEN** vacaciones is $510.680,63 (1.750.905 × 210 ÷ 720)

#### Scenario: Negative vacaciones stay unclamped with a warning
- **WHEN** días disfrutados is greater than días causados
- **THEN** vacaciones is negative and unclamped, with the warning "Tomaste más vacaciones de las que tenías acumuladas — esto puede generar un descuento en tu liquidación, verifícalo con RR.HH."

### Requirement: Auxilio de transporte auto-derivation

The system MUST derive auxilio automatically (salario ≤ 2 SMMLV), MUST show an "Aplica/No aplica" badge, and MUST NOT offer a manual toggle.

#### Scenario: Auxilio applies at or below two SMMLV
- **WHEN** salario is $1.750.905 (≤ 2 SMMLV = $2.847.000)
- **THEN** auxilio $249.095 enters the cesantías and prima bases and the badge shows "Aplica"

#### Scenario: Auxilio does not apply above two SMMLV
- **WHEN** salario is above 2 SMMLV
- **THEN** auxilio is 0 and the badge shows "No aplica"

### Requirement: Result rendering

Each concept line MUST show concepto, the formula with the user's real inputs, and the legal citation (e.g., "Cesantías — (1.750.905 + 249.095) × 210 ÷ 360 — Art. 249 CST").

#### Scenario: Every result line shows all three elements
- **WHEN** a completed calculation is rendered
- **THEN** every line shows all three elements

### Requirement: Worked example card

The system MUST show a fixed, non-editable worked example (01-ene-2026 → 31-jul-2026, salario $1.750.905, auxilio $249.095) with the pinned values.

#### Scenario: Example card shows pinned values and is not editable
- **WHEN** the user opens the liquidación view
- **THEN** the example card shows cesantías $1.166.666,67, intereses $81.666,67, prima $166.666,67, vacaciones $510.680,63 and is not editable

### Requirement: Navigation

The system MUST expose a dedicated liquidación view reachable from the main navigation.

#### Scenario: Liquidación link reaches the view
- **WHEN** the main navigation is visible
- **THEN** activating the Liquidación link shows the liquidación view
