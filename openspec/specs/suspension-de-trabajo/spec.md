# Suspensión del Contrato de Trabajo Specification

## Purpose

Educational + tracking module (Módulo 3, CST Arts. 51 y 53) rendered under `/liquidacion`: explains the 8 causales of Art. 51 CST in plain language, shows the Art. 53 asymmetric-effect table with CSJ fundamento, and tracks suspension periods via a 10-option causal selector with full CRUD in localStorage, per-record checklists, and a conditional Art. 112 excess warning. Tracking only — no peso calculation and no `liquidacion.ts` integration.

## Requirements

### Requirement: Educational content — Art. 51 CST causales

The system MUST render the 8 causales of Art. 51 CST in plain language, each with its verbatim legal citation: fuerza mayor o caso fortuito; muerte o inhabilitación del empleador (personas naturales); suspensión de actividades de la empresa hasta 120 días; licencia o permiso temporal acordado; suspensión disciplinaria; detención preventiva del trabajador hasta 8 días; arresto correccional hasta 8 días; huelga declarada.

GIVEN|WHEN|THEN
---|---|--
the educational section renders|viewing|all 8 causales appear in plain language, each with its CST Art. 51 citation
a causal is expanded or listed|viewing|the legal citation is shown verbatim and no calculation is triggered

### Requirement: Art. 53 CST asymmetric-effect table

The system MUST render an Art. 53 CST table with asymmetric effects: during suspension the worker receives NO salary; cesantías and vacaciones MAY be deducted from antigüedad; prima de servicios and intereses sobre cesantías MUST NOT be deducted, citing the CSJ jurisprudencia fundamento (not only the article). Exception: incapacidad no profesional ≤ 180 días and licencia de maternidad/paternidad MUST count as worked time for ALL prestaciones.

GIVEN|WHEN|THEN
---|---|--
the Art. 53 table renders|viewing|salario shows no pay, cesantías/vacaciones show MAY-deduct, prima/intereses show MUST NOT deduct
the prima de servicios and intereses sobre cesantías rows render|viewing|the CSJ jurisprudencia fundamento citation is shown, not only Art. 53 CST
the record causal is incapacidad no profesional ≤ 180 días or licencia de maternidad/paternidad|computing|the period counts as worked time for ALL prestaciones

### Requirement: Causal selector with 10 options (D1)

The system MUST expose a selector with exactly 10 causal options: the 8 causales of Art. 51 CST plus incapacidad médica and licencia de maternidad/paternidad. Selecting a causal MUST record its label and legal reference on the registry entry.

GIVEN|WHEN|THEN
---|---|--
a worker opens the causal selector|selecting|all 10 options are available and selectable
a worker logs a period with incapacidad médica or licencia de maternidad/paternidad|saving|the entry stores the special causal with its label

### Requirement: Suspension period registry with full CRUD (D3)

The system MUST let the worker register suspension periods (fecha inicio, fecha fin, causal), MUST persist them in localStorage under key `nomina-clara-suspensiones`, and MUST support add, edit, and delete. Dates MUST be ISO `YYYY-MM-DD`; duration in calendar days; fecha fin MUST NOT be before fecha inicio.

GIVEN|WHEN|THEN
---|---|--
a worker saves a period with valid dates and a causal|saving|the period is added to the list and persisted under `nomina-clara-suspensiones`
a worker enters a fecha fin before fecha inicio|saving|the record is rejected with a validation error and not persisted
a worker edits an existing period's dates or causal|saving|the updated record replaces the stored one in localStorage
a worker deletes a period|deleting|the record is removed from the list and from localStorage

### Requirement: Per-record checklist summary

The system MUST render a checklist summary per record. Standard causales: standard text — the period should NOT affect prima de servicios nor intereses sobre cesantías, and MAY be deducted from vacaciones and cesantías acumuladas (verify the employer applies it that way). Special causales (incapacidad/licencia): the period is NOT deducted from ANY prestación.

GIVEN|WHEN|THEN
---|---|--
a record uses a standard Art. 51 causal|viewing|the checklist shows the standard text (no prima/intereses impact; MAY deduct vacaciones/cesantías, verify with employer)
a record uses incapacidad médica or licencia de maternidad/paternidad|viewing|the checklist states the period is NOT deducted from ANY prestación

### Requirement: Art. 112 conditional excess warning (D2)

ONLY for the causal suspensión disciplinaria, the system MUST ask whether it is the worker's first disciplinary suspension or a reincidencia, and MUST warn when the duration exceeds the threshold: 8 días for a first suspension, 60 días for reincidencia. Other causales MUST NOT show the Art. 112 field.

GIVEN|WHEN|THEN
---|---|--
a first disciplinary suspension lasts exactly 8 días|computing|no excess warning is shown
a first disciplinary suspension lasts 9 días|computing|the Art. 112 excess warning is shown
a reincidencia lasts exactly 60 días|computing|no excess warning is shown
a reincidencia lasts 61 días|computing|the Art. 112 excess warning is shown
a causal other than suspensión disciplinaria is selected|selecting|the Art. 112 question and warning are never shown
