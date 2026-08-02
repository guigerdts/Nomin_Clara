# draft-quincena Specification

## Purpose
TBD - created by archiving change daily-draft-quincena. Update Purpose after archive.
## Requirements
### Requirement: Daily "Hoy" section (schedule mode only)

The system MUST render a "Hoy" section inside `PayrollForm` when `inputMode === 'schedule'`, below the mode toggle: a button to add today's date with entry/exit/lunch fields, a progress counter of registered days vs total days in the current fortnight, and a list of draft days with inline edit and remove.

#### Scenario: Hoy section renders in schedule mode
- **WHEN** the page is in "Horario Detallado" mode
- **THEN** the "Hoy" section is visible with the add-today button, progress counter, and draft day list

#### Scenario: Hoy section is absent in manual mode
- **WHEN** the page is in "Manual" mode
- **THEN** the "Hoy" section is not rendered

### Requirement: Auto-persist to per-fortnight localStorage key

The system MUST persist the draft on every add/update/remove of a draft day (not on keystroke) under key `nomina-clara-draft-{startDate}` (e.g. `nomina-clara-draft-2026-07-01`), wrapped in try/catch for quota errors, and MUST reload the draft from localStorage on mount.

#### Scenario: Adding a day persists immediately
- **WHEN** a worker adds a draft day
- **THEN** the draft is written to `nomina-clara-draft-{startDate}` without further action

#### Scenario: Page refresh within the same fortnight
- **WHEN** the page reloads during the same fortnight
- **THEN** the draft is reloaded from localStorage with all previously added days

### Requirement: Fortnight detection

The system MUST compute the current fortnight range from today's date: day ≤ 15 → start day 01 of the month, end day 15; day > 15 → start day 16, end the month's last day. The progress counter MUST use this computed total, never a hardcoded 15.

#### Scenario: First half of the month
- **WHEN** today is day 1–15 of the month
- **THEN** the fortnight runs from the 1st to the 15th and the progress total equals 15

#### Scenario: Second half of the month
- **WHEN** today is day 16 or later
- **THEN** the fortnight runs from the 16th to the last day of the month and the progress total is dynamic (e.g. 13–16 depending on month length)

### Requirement: Upsert on same-date re-entry

The system MUST update the existing entry when the same date is added again — never creating duplicate rows.

#### Scenario: Re-adding an existing date
- **WHEN** a worker adds a day whose date already exists in the draft
- **THEN** the existing entry is updated and no duplicate row is created

### Requirement: Stale draft detection with explicit resolution

The system MUST detect a draft whose `startDate` does not match the current fortnight and MUST show a confirmation dialog ("Tienes un registro sin cerrar del [rango de fechas] — ¿querés cerrarlo ahora o descartarlo?"). It MUST NOT auto-clear the stale draft. "Cerrar" converts the draft to a `SavedRecord`; "Descartar" deletes the draft key. No action is taken without an explicit user decision.

#### Scenario: Stale draft from a prior fortnight
- **WHEN** a draft exists whose startDate differs from the current fortnight
- **THEN** the confirmation dialog is shown on mount with "Cerrar" and "Descartar" options

#### Scenario: Cerrar resolves the stale draft
- **WHEN** the worker chooses "Cerrar" in the stale dialog
- **THEN** the draft is converted to a `SavedRecord` via the existing save flow

#### Scenario: Descartar discards the stale draft
- **WHEN** the worker chooses "Descartar" in the stale dialog
- **THEN** the draft key is removed from localStorage and the draft state resets

### Requirement: Close fortnight converts draft to SavedRecord

The system MUST provide a "Cerrar quincena & save" action that builds a `SavedRecord` from the current calculator state plus the draft's `workedDays`, calls `saveRecord()`, removes the draft key, and refreshes the saved-records history. If no calculation exists yet, the system MUST warn before closing without calculating.

#### Scenario: Closing a completed fortnight
- **WHEN** the worker clicks "Cerrar quincena & save" with a calculated result
- **THEN** a `SavedRecord` is created from the draft days, the draft key is removed, and the record appears in history

#### Scenario: Closing without a calculation
- **WHEN** the worker clicks close but no calculation exists
- **THEN** a warning is shown ("No hay cálculo. ¿Cerrar sin calcular?") before the close proceeds

