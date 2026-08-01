# Delta for Suspensión del Contrato de Trabajo

## Change

Adds the `suspension-de-trabajo` capability (Módulo 3, CST Arts. 51 y 53): educational content for the 8 causales, the Art. 53 asymmetric-effect table with CSJ fundamento, a 10-option causal selector (D1), a suspension-period registry with full CRUD in localStorage (D3), per-record checklist summaries, and a conditional Art. 112 excess warning (8 días primera vez / 60 días reincidencia, D2). Tracking-only — no peso calculation and no `liquidacion.ts` integration.

## ADDED Requirements

### Requirement: Educational content — Art. 51 CST causales

The system MUST render the 8 causales of Art. 51 CST in plain language, each with its verbatim legal citation: fuerza mayor o caso fortuito; muerte o inhabilitación del empleador (personas naturales); suspensión de actividades de la empresa hasta 120 días; licencia o permiso temporal acordado; suspensión disciplinaria; detención preventiva del trabajador hasta 8 días; arresto correccional hasta 8 días; huelga declarada.

#### Scenario: All eight causales with plain-language explanations
- **WHEN** the educational section renders
- **THEN** all 8 causales appear in plain language, each with its CST Art. 51 citation

#### Scenario: Citation is verbatim and display-only
- **WHEN** a causal is expanded or listed
- **THEN** the legal citation is shown verbatim and no calculation is triggered

### Requirement: Art. 53 CST asymmetric-effect table

The system MUST render an Art. 53 CST table with asymmetric effects: during suspension the worker receives NO salary; cesantías and vacaciones MAY be deducted from antigüedad; prima de servicios and intereses sobre cesantías MUST NOT be deducted, citing the CSJ jurisprudencia fundamento (not only the article). Exception: incapacidad no profesional ≤ 180 días and licencia de maternidad/paternidad MUST count as worked time for ALL prestaciones.

#### Scenario: Asymmetric effects rendered per concept
- **WHEN** the Art. 53 table renders
- **THEN** salario shows no pay, cesantías/vacaciones show MAY-deduct, prima/intereses show MUST NOT deduct

#### Scenario: CSJ fundamento cited for prima and intereses
- **WHEN** the prima de servicios and intereses sobre cesantías rows render
- **THEN** the CSJ jurisprudencia fundamento citation is shown, not only Art. 53 CST

#### Scenario: Incapacidad and licencia count as worked time
- **WHEN** the record causal is incapacidad no profesional ≤ 180 días or licencia de maternidad/paternidad
- **THEN** the period counts as worked time for ALL prestaciones

### Requirement: Causal selector with 10 options (D1)

The system MUST expose a selector with exactly 10 causal options: the 8 causales of Art. 51 CST plus incapacidad médica and licencia de maternidad/paternidad. Selecting a causal MUST record its label and legal reference on the registry entry.

#### Scenario: All ten options are selectable
- **WHEN** a worker opens the causal selector
- **THEN** all 10 options are available and selectable

#### Scenario: Special causales are selectable alongside Art. 51 causales
- **WHEN** a worker logs a period with incapacidad médica or licencia de maternidad/paternidad
- **THEN** the entry stores the special causal with its label

### Requirement: Suspension period registry with full CRUD (D3)

The system MUST let the worker register suspension periods (fecha inicio, fecha fin, causal), MUST persist them in localStorage under key `nomina-clara-suspensiones`, and MUST support add, edit, and delete. Dates MUST be ISO `YYYY-MM-DD`; duration in calendar days; fecha fin MUST NOT be before fecha inicio.

#### Scenario: Adding a period persists it
- **WHEN** a worker saves a period with valid dates and a causal
- **THEN** the period is added to the list and persisted under `nomina-clara-suspensiones`

#### Scenario: End date before start date is rejected
- **WHEN** a worker enters a fecha fin before fecha inicio
- **THEN** the record is rejected with a validation error and not persisted

#### Scenario: Editing updates the persisted record
- **WHEN** a worker edits an existing period's dates or causal
- **THEN** the updated record replaces the stored one in localStorage

#### Scenario: Deleting removes the record
- **WHEN** a worker deletes a period
- **THEN** the record is removed from the list and from localStorage

### Requirement: Per-record checklist summary

The system MUST render a checklist summary per record. Standard causales: standard text — the period should NOT affect prima de servicios nor intereses sobre cesantías, and MAY be deducted from vacaciones and cesantías acumuladas (verify the employer applies it that way). Special causales (incapacidad/licencia): the period is NOT deducted from ANY prestación.

#### Scenario: Standard checklist text for standard causales
- **WHEN** a record uses a standard Art. 51 causal
- **THEN** the checklist shows the standard text (no prima/intereses impact; MAY deduct vacaciones/cesantías, verify with employer)

#### Scenario: Special checklist text for incapacidad or licencia
- **WHEN** a record uses incapacidad médica or licencia de maternidad/paternidad
- **THEN** the checklist states the period is NOT deducted from ANY prestación

### Requirement: Art. 112 conditional excess warning (D2)

ONLY for the causal suspensión disciplinaria, the system MUST ask whether it is the worker's first disciplinary suspension or a reincidencia, and MUST warn when the duration exceeds the threshold: 8 días for a first suspension, 60 días for reincidencia. Other causales MUST NOT show the Art. 112 field.

#### Scenario: First suspension of exactly 8 days shows no warning
- **WHEN** a first disciplinary suspension lasts exactly 8 days
- **THEN** no excess warning is shown

#### Scenario: First suspension of 9 days shows the warning
- **WHEN** a first disciplinary suspension lasts 9 days
- **THEN** the Art. 112 excess warning is shown

#### Scenario: Reincidencia of exactly 60 days shows no warning
- **WHEN** a reincidencia lasts exactly 60 days
- **THEN** no excess warning is shown

#### Scenario: Reincidencia of 61 days shows the warning
- **WHEN** a reincidencia lasts 61 days
- **THEN** the Art. 112 excess warning is shown

#### Scenario: Non-disciplinary causales never trigger the field
- **WHEN** a causal other than suspensión disciplinaria is selected
- **THEN** the Art. 112 question and warning are never shown
