# Proposal: Modo de horario detallado con perfil base + excepciones por día

## Intent

Manual 7-field hour entry (dayOT, nightOT, holidayDayOT, etc.) is error-prone and tedious. Users need to mentally classify every hour they worked into legal categories. This change replaces that mental work with a schedule-based input: the user configures a base weekly profile once, enters actual clock-in/clock-out per day, and the app auto-classifies hours into the 7 legal concepts.

## Scope

### In Scope
- Weekly schedule profile form — cada día laboral con su propio horario (entrada/salida/almuerzo), 30-min granularidad. Días que comparten horario pueden configurarse juntos.
- Day-by-day worked entry form con pre-filled desde el horario del día específico de la semana
- Auto-classification engine as pure function in `lib/` producing `PayrollInput`
- Colombian fixed-date holiday list + `isHoliday()` detector
- Mode toggle (Manual ↔ Schedule) in CalculatorPage with form clear on switch
- Inline per-day breakdown display for each classified concept
- Save schedule profile + worked days in `SavedRecord` for history/audit
- Truncate-to-2-decimal precision for all hour and currency output
- Mode marker on saved records

### Out of Scope
- Easter-dependent holidays (Semana Santa, Ascensión, etc.) — v2
- Automated interval overlap detection — 30-min grid entry
- Night surcharge micro-classification by time range — v2
- Manual override of individual auto-classified entries — v2
- Edit saved profile without creating new record — v2

## Capabilities

### New Capabilities
- `schedule-classifier`: Pure classification engine (`scheduleClassifier()`) that takes `ScheduleProfile` + `WorkedDay[]` + holiday check → produces `PayrollInput` feeding into `calculateBreakdown()`. Covers: schedule profile definition, day-level worked entry, fixed-date holiday detection, 7-concept hour distribution rules.

### Modified Capabilities
- `legal`: `SavedRecord` schema gains optional `scheduleProfile` and `workedDays` fields; storage functions remain unchanged. No spec-level behavior changes to calculation pipeline.

## Approach

Pure function in `lib/scheduleClassifier.ts` — zero changes to `calculateBreakdown()`. Flow: `UserInput → scheduleClassifier() → PayrollInput → calculateBreakdown() → render`. Schedule state managed in CalculatorPage with clear-on-mode-toggle. All times at 30-min granularity; decimal hour output truncated to 2 places.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/types.ts` | Modified | `ScheduleProfile` now uses per-day `schedules` map en vez de entry/exit único |
| `src/lib/holidays.ts` | New | Fixed-date Colombian holidays + `isHoliday()` |
| `src/lib/scheduleClassifier.ts` | New | Pure classification engine |
| `src/lib/storage.ts` | Modified | Optional schedule profile in `SavedRecord` |
| `src/pages/CalculatorPage/CalculatorPage.tsx` | Modified | Mode toggle state + schedule bridge |
| `src/pages/CalculatorPage/PayrollForm.tsx` | Modified | Mode selector UI |
| `src/pages/CalculatorPage/ScheduleProfileForm.tsx` | New | Weekly profile config form |
| `src/pages/CalculatorPage/DayEntryForm.tsx` | New | Worked day entry grid |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Per-day schedule complexity | Medium | UI debe permitir horarios distintos por día sin ser tedioso; botón "usar mismo horario" |
| Migration (old profile format) | Low | Perfiles viejos sin schedules por día se migran: todos los días laborales reciben el único horario guardado |
| UI scope creep | Medium | Ship mode toggle + profile form first, day-entry grid next |
| Edge cases in classification | Low | 30-min grid, fractional hours with binary classification |
| User confusion on modes | Low | Brief description at toggle explaining each mode |

## Rollback Plan

Revert `CalculatorPage.tsx` and `PayrollForm.tsx` to remove mode toggle. Delete new components and lib files. Old records untouched — they store `PayrollInput` directly.

## Dependencies

- None external. All data in localStorage.

## Success Criteria

- [ ] User can configure a weekly schedule profile and enter worked days
- [ ] scheduleClassifier() correctly distributes hours into 7 legal concepts
- [ ] Fixed-date holidays (20 de Julio, 7 de Agosto, etc.) detected correctly
- [ ] Mode toggle switches between manual and schedule forms cleanly
- [ ] All existing 66 tests still pass; new classifier tests pass
- [ ] Saved records mark which mode was used
