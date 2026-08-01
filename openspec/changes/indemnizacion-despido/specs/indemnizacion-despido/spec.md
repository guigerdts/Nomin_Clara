# Delta for Indemnización por Despido

## Change

Adds the `indemnizacion-despido` capability (Art. 64 CST): gate + three calculators (fijo, indefinido, obra) below prestaciones, Art. 46 CST notices.

## ADDED Requirements

### Requirement: Termination qualifier gate (Art. 64 CST)

MUST expose a radio with four options: "Despido sin justa causa", "Renuncia", "Mutuo acuerdo", "Despido con justa causa comprobada". Only "Despido sin justa causa" MUST enable inputs and results; the other three MUST show a visible warning (no such right, Art. 64 CST) and MUST NOT calculate.

GIVEN|WHEN|THEN
-|-|-
user selects "Renuncia", "Mutuo acuerdo", or "Despido con justa causa comprobada"|submitting|warning shown; no calculation rendered
user selects "Despido sin justa causa"|rendering|inputs and results enabled

### Requirement: Término fijo (Art. 64 CST)

`indemnización = (salario ÷ 30) × díasRestantes`; díasRestantes = commercial days dismissal→planned end (30-day months, 360-day year); mesesRestantes = díasRestantes ÷ 30. Inputs: salario, start, planned end, dismissal, optional renewals. The system MUST show the Art. 46 CST notice (fijo < 1 año: máx 3 prórrogas cortas de igual duración; la 4ª ≥ 1 año) and, when renewals ≥ 3, the advisory "verifícalo con RR.HH.". Contract expired before dismissal → MUST be 0 with explanatory note.

GIVEN|WHEN|THEN
-|-|-
salario $1.800.000, 60 días remaining (2 meses)|computing|$3.600.000 (1.800.000 ÷ 30 × 60)
planned end date before dismissal date|computing|0 + note "contrato ya vencido"
renewals = 4|rendering|Art. 46 CST notice + "verifícalo con RR.HH."

### Requirement: Término indefinido (Art. 64 CST)

Scale by salario vs. 10 SMMLV = $17.509.050 (2026; MUST derive from the SMMLV constant, never hardcode). Low (< 10 SMMLV): 30 días first year + 20 per additional year, proportional. High (≥ 10 SMMLV, exactly 10 included): 20 + 15. `díasTotal = primerAño + añosAdicionales × díasPorAño`; `añosAdicionales = (díasServicio − 360) ÷ 360` (0 when ≤ 360); `indemnización = (salario ÷ 30) × díasTotal`; días commercial. Inputs: salario, service start, dismissal.

GIVEN|WHEN|THEN
-|-|-
salario $1.750.905 (1 SMMLV), 540 días (18 months)|computing|40 días: 30 + (540−360)÷360 × 20 → (1.750.905 ÷ 30) × 40 = $2.334.540
salario $1.750.905, exactly 360 días (1 year)|computing|30 días, no fraction → $1.750.905
salario = SMMLV × 10 ($17.509.050), 540 días|computing|high branch: 20 + 0,5 × 15 = 27,5 días → $16.049.962,50 (formatCOPExact)

### Requirement: Obra o labor (Art. 64 CST)

`indemnización = max((salario ÷ 30) × díasRestantes, (salario ÷ 30) × 15)` — floor 15 días; díasRestantes = commercial days dismissal→planned end of obra. Obra finished before dismissal → MUST be 0. Inputs: salario, obra start, planned end, dismissal.

GIVEN|WHEN|THEN
-|-|-
salario $1.800.000, 30 días remaining|computing|$1.800.000 (1.800.000 ÷ 30 × 30)
salario $1.800.000, 10 días remaining (< 15)|computing|floor 15 días: (1.800.000 ÷ 30) × 15 = $900.000
planned end before dismissal date|computing|0

### Requirement: Salary base and output conventions

Base MUST be the monthly salary only, WITHOUT auxilio de transporte (Art. 64 CST orders no inclusion; auxilio is not salary; included in cesantías/prima only per Ley 1ª de 1963 Art. 7). Results MUST use the ConceptLine pattern (concepto + fórmula + legalRef) like prestaciones; every result line MUST carry its citation (Art. 64 CST; Art. 46 CST on the renewal notice). Centavo amounts MUST use formatCOPExact; whole-peso MAY use formatCOP. The section MUST coexist with prestaciones on the same page, behavior unchanged.

GIVEN|WHEN|THEN
-|-|-
salario $1.750.905 with auxilio applicable (≤ 2 SMMLV)|computing|base uses $1.750.905 only; auxilio excluded
a completed calculation|rendering|every line shows concepto + fórmula + legalRef; centavo amounts via formatCOPExact
the section renders in /liquidacion|rendering|prestaciones results unchanged

### Requirement: Educational content (Art. 46 CST, advisory)

MAY display the Art. 46 CST renewal notice; warnings for Renuncia / Mutuo acuerdo / Despido con justa causa comprobada; and a footnote that variable-income workers (commissions, habitual overtime) may be entitled to a last-year-average base per Corte Suprema doctrine. Footnote MUST NOT trigger a calculation (out of scope).

GIVEN|WHEN|THEN
-|-|-
término fijo with renewals ≥ 3|rendering|renewal notice + HR advisory shown; calculation unaffected
a variable-income worker is viewing|rendering|footnote displayed; no base change calculated
