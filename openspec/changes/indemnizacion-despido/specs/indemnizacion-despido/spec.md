# Delta for Indemnización por Despido

## Change

Adds the `indemnizacion-despido` capability (Art. 64 CST): gate + three calculators (fijo, indefinido, obra) below prestaciones, Art. 46 CST notices.

## ADDED Requirements

### Requirement: Termination qualifier gate (Art. 64 CST)

MUST expose a radio with four options: "Despido sin justa causa", "Renuncia", "Mutuo acuerdo", "Despido con justa causa comprobada". Only "Despido sin justa causa" MUST enable inputs and results; the other three MUST show a visible warning (no such right, Art. 64 CST) and MUST NOT calculate.

#### Scenario: Non-despido qualifiers show warning and do not calculate
- **WHEN** user selects "Renuncia", "Mutuo acuerdo", or "Despido con justa causa comprobada"
- **THEN** a visible warning is shown (no such right, Art. 64 CST) and no calculation is rendered

#### Scenario: Despido sin justa causa enables inputs and results
- **WHEN** user selects "Despido sin justa causa"
- **THEN** inputs and results are enabled

### Requirement: Término fijo (Art. 64 CST)

`indemnización = (salario ÷ 30) × díasRestantes`; díasRestantes = commercial days dismissal→planned end (30-day months, 360-day year); mesesRestantes = díasRestantes ÷ 30. Inputs: salario, start, planned end, dismissal, optional renewals. The system MUST show the Art. 46 CST notice (fijo < 1 año: máx 3 prórrogas cortas de igual duración; la 4ª ≥ 1 año) and, when renewals ≥ 3, the advisory "verifícalo con RR.HH.". Contract expired before dismissal → MUST be 0 with explanatory note.

#### Scenario: Fixed-term indemnización with remaining time
- **WHEN** salario $1.800.000 and 60 días remaining (2 meses)
- **THEN** indemnización is $3.600.000 (1.800.000 ÷ 30 × 60)

#### Scenario: Contract already expired
- **WHEN** planned end date is before the dismissal date
- **THEN** indemnización is 0 with the note "contrato ya vencido"

#### Scenario: Four renewals trigger the HR advisory
- **WHEN** renewals = 4
- **THEN** the Art. 46 CST notice and "verifícalo con RR.HH." are rendered

### Requirement: Término indefinido (Art. 64 CST)

Scale by salario vs. 10 SMMLV = $17.509.050 (2026; MUST derive from the SMMLV constant, never hardcode). Low (< 10 SMMLV): 30 días first year + 20 per additional year, proportional. High (≥ 10 SMMLV, exactly 10 included): 20 + 15. `díasTotal = primerAño + añosAdicionales × díasPorAño`; `añosAdicionales = (díasServicio − 360) ÷ 360` (0 when ≤ 360); `indemnización = (salario ÷ 30) × díasTotal`; días commercial. Inputs: salario, service start, dismissal.

#### Scenario: Low-branch indefinite contract with partial extra year
- **WHEN** salario $1.750.905 (1 SMMLV) and 540 días of service (18 months)
- **THEN** indemnización is 40 días (30 + (540−360)÷360 × 20), giving (1.750.905 ÷ 30) × 40 = $2.334.540

#### Scenario: Exactly one year keeps the base days only
- **WHEN** salario $1.750.905 and exactly 360 días of service (1 year)
- **THEN** indemnización is 30 días with no fraction, $1.750.905

#### Scenario: High-branch indefinite contract at 10 SMMLV
- **WHEN** salario = SMMLV × 10 ($17.509.050) and 540 días of service
- **THEN** the high branch applies (20 + 0,5 × 15 = 27,5 días), giving $16.049.962,50 via formatCOPExact

### Requirement: Obra o labor (Art. 64 CST)

`indemnización = max((salario ÷ 30) × díasRestantes, (salario ÷ 30) × 15)` — floor 15 días; díasRestantes = commercial days dismissal→planned end of obra. Obra finished before dismissal → MUST be 0. Inputs: salario, obra start, planned end, dismissal.

#### Scenario: Work-by-project indemnización with time remaining
- **WHEN** salario $1.800.000 and 30 días remaining
- **THEN** indemnización is $1.800.000 (1.800.000 ÷ 30 × 30)

#### Scenario: Work-by-project floor of 15 days
- **WHEN** salario $1.800.000 and 10 días remaining (< 15)
- **THEN** the 15-day floor applies: (1.800.000 ÷ 30) × 15 = $900.000

#### Scenario: Project already finished
- **WHEN** planned end of obra is before the dismissal date
- **THEN** indemnización is 0

### Requirement: Salary base and output conventions

Base MUST be the monthly salary only, WITHOUT auxilio de transporte (Art. 64 CST orders no inclusion; auxilio is not salary; included in cesantías/prima only per Ley 1ª de 1963 Art. 7). Results MUST use the ConceptLine pattern (concepto + fórmula + legalRef) like prestaciones; every result line MUST carry its citation (Art. 64 CST; Art. 46 CST on the renewal notice). Centavo amounts MUST use formatCOPExact; whole-peso MAY use formatCOP. The section MUST coexist with prestaciones on the same page, behavior unchanged.

#### Scenario: Auxilio excluded from the indemnización base
- **WHEN** salario $1.750.905 with auxilio applicable (≤ 2 SMMLV)
- **THEN** the base uses $1.750.905 only and auxilio is excluded

#### Scenario: Concept-line rendering with citations
- **WHEN** a completed calculation is rendered
- **THEN** every line shows concepto + fórmula + legalRef and centavo amounts use formatCOPExact

#### Scenario: Coexistence with prestaciones results
- **WHEN** the section renders in /liquidacion
- **THEN** prestaciones results remain unchanged

### Requirement: Educational content (Art. 46 CST, advisory)

MAY display the Art. 46 CST renewal notice; warnings for Renuncia / Mutuo acuerdo / Despido con justa causa comprobada; and a footnote that variable-income workers (commissions, habitual overtime) may be entitled to a last-year-average base per Corte Suprema doctrine. Footnote MUST NOT trigger a calculation (out of scope).

#### Scenario: Renewal notice and HR advisory
- **WHEN** a término fijo contract has renewals ≥ 3
- **THEN** the renewal notice and HR advisory are shown and the calculation is unaffected

#### Scenario: Variable-income footnote is display-only
- **WHEN** a variable-income worker is viewing
- **THEN** the footnote is displayed and no base change is calculated
