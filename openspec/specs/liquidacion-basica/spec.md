# Liquidación Básica (Prestaciones Sociales) Specification

## Purpose

Computes statutory prestaciones owed at contract end — cesantías (Art. 249 CST), intereses (Ley 52/1975), prima (Art. 306 CST), vacaciones (Art. 186 CST) — each shown with formula (real inputs) and legal citation.

## Requirements

### Requirement: Días trabajados (commercial day count)

The system MUST count días trabajados commercially: full month = 30 days (360-day year), and a partial month MUST count its actual elapsed days (e.g., 15-ene→31-jul = 6 full months × 30 + 17 = 197 días; 01-ene→31-jul = 210). ALL day counts in this module use commercial 30-day months for full months, without exception — including the semester overlap for prima. Rationale (audit note): the ÷360 and ÷720 divisors are only consistent under that assumption; calendar counts (01-ene→31-jul = 212) would diverge from Colombian payroll calculators — 210 is NOT a bug, and the semester split (180 + 30) MUST also sum to the total (210). Do NOT "correct" any day count toward calendar days: that would break internal consistency. Do NOT round a partial month up to a full month: that would overstate what the employer owes and damage the tool's credibility.

GIVEN|WHEN|THEN
---|---|--
start 01-ene-2026, end 31-jul-2026|computing días trabajados|210 (7 × 30)
start 01-ene-2026, end 31-ene-2026|computing días trabajados|30 (boundaries inclusive)
start equals end|computing días trabajados|0

### Requirement: Cesantías (Art. 249 CST)

`cesantías = (salario + auxilio) × días ÷ 360`.

GIVEN|WHEN|THEN
---|---|--
salario $1.750.905, auxilio $249.095 (base $2.000.000), 210 días|computing cesantías|$1.166.666,67 (2.000.000 × 210 ÷ 360)
salario 0|computing cesantías|0

### Requirement: Intereses sobre cesantías (Ley 52/1975)

`intereses = cesantías × 12% × (días ÷ 360)`.

GIVEN|WHEN|THEN
---|---|--
cesantías $1.166.666,67, 210 días|computing intereses|$81.666,67 (1.166.666,67 × 12% × 210 ÷ 360)
positive cesantías, 0 días|computing intereses|0

### Requirement: Prima de servicios (Art. 306 CST)

`prima = (salario + auxilio) × días del semestre en curso ÷ 360`. Semester auto-detected from END date (ene-jun → 1st; jul-dic → 2nd); days = worked days inside it, boundaries inclusive.

GIVEN|WHEN|THEN
---|---|--
end 31-jul-2026, overlap jul = 30 días (1 mes comercial), base $2.000.000|computing prima|$166.666,67 (2.000.000 × 30 ÷ 360)
start 01-ene-2026, end 30-jun-2026|computing prima|only ene-jun worked days counted (180 días commercial)
start 01-ene-2026, end 31-dic-2026|computing prima|semester jul-dic, whole semester counted (180 días commercial)
no worked days in end-date semester|computing prima|0
period spans two semesters (01-ene-2026 → 31-jul-2026)|rendering the prima result|warning "Esto es solo la prima del semestre en curso — si el semestre anterior no se pagó, agrégalo aparte" AND amount reflects only jul-dic days

### Requirement: Vacaciones (Art. 186 CST)

`vacaciones = (salario SIN auxilio) × días ÷ 720 − días disfrutados`. The system MUST NOT clamp a negative net to $0 and MUST show a neutral warning (employer may deduct the excess at final liquidation — valid exception to Art. 149 CST).

GIVEN|WHEN|THEN
---|---|--
salario $1.750.905 (sin auxilio), 210 días, 0 disfrutados|computing vacaciones|$510.680,63 (1.750.905 × 210 ÷ 720)
días disfrutados > días causados|computing vacaciones|negative, unclamped, warning "Tomaste más vacaciones de las que tenías acumuladas — esto puede generar un descuento en tu liquidación, verifícalo con RR.HH."

### Requirement: Auxilio de transporte auto-derivation

The system MUST derive auxilio automatically (salario ≤ 2 SMMLV), show an "Aplica/No aplica" badge, and MUST NOT offer a manual toggle.

GIVEN|WHEN|THEN
---|---|--
salario $1.750.905 (≤ 2 SMMLV = $2.847.000)|computing|auxilio $249.095 enters cesantías and prima bases; badge "Aplica"
salario above 2 SMMLV|computing|auxilio 0; badge "No aplica"

### Requirement: Result rendering

Each concept line MUST show concepto, the formula with the user's real inputs, and the legal citation (e.g., "Cesantías — (1.750.905 + 249.095) × 210 ÷ 360 — Art. 249 CST").

GIVEN|WHEN|THEN
---|---|--
a completed calculation|rendering results|every line shows all three elements

### Requirement: Worked example card

The system MUST show a fixed, non-editable worked example (01-ene-2026 → 31-jul-2026, salario $1.750.905, auxilio $249.095) with the pinned values.

GIVEN|WHEN|THEN
---|---|--
the user opens the liquidación view|viewing the example card|cesantías $1.166.666,67, intereses $81.666,67, prima $166.666,67, vacaciones $510.680,63; card not editable

### Requirement: Navigation

The system MUST expose a dedicated liquidación view reachable from the main navigation.

GIVEN|WHEN|THEN
---|---|--
the main navigation is visible|activating the Liquidación link|the liquidación view is shown
