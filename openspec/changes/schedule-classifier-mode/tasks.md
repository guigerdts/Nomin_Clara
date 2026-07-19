# Tasks: Schedule Classifier Mode

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

| Field | Value |
|-------|-------|
| Estimated changed lines | ~850 (3 PRs: ~340 + ~260 + ~250) |
| 400-line budget risk | Low (each PR < 400) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Components) → PR 3 (Integration) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Types + holidays + classifier engine + tests | PR 1 | `npx vitest run src/lib/__tests__/scheduleClassifier.test.ts src/lib/__tests__/holidays.test.ts` | N/A — pure lib, no UI needed | Delete `holidays.ts`, `scheduleClassifier.ts`, test files; revert `types.ts` additions |
| 2 | ScheduleProfileForm + DayEntryForm components | PR 2 | `npx vitest run src/pages/CalculatorPage/__tests__/ScheduleProfileForm.test.tsx src/pages/CalculatorPage/__tests__/DayEntryForm.test.tsx` | Manual browser or component-story render | Delete component files and CSS modules |
| 3 | Mode toggle + CalculatorPage + storage + integration tests | PR 3 | `npx vitest run src/pages/CalculatorPage/__tests__/CalculatorPage.test.tsx` | Full app: switch mode, save, verify history | Revert `CalculatorPage.tsx`, `PayrollForm.tsx`, `storage.ts`, `types.ts` changes |

## Phase 1: Foundation — Types, Holidays, Classifier (PR 1)

- [x] T1.1 Add `InputMode`, `DayOfWeek`, `ScheduleProfile`, `WorkedDay`, `ScheduleClassifierInput` to `src/lib/types.ts`
- [x] T1.2 Create `src/lib/holidays.ts` — `HOLIDAYS_2026` (19 entries), `isHoliday()`, `getHolidayName()`, Ley 2578/2026 annotation for July 13
- [x] T1.3 Create `src/lib/scheduleClassifier.ts` — `scheduleClassifier()` with per-day classification matrix, day/night split (06:00/19:00), 30-min granularity, 2-decimal truncation
- [x] T1.4 Write `src/lib/__tests__/holidays.test.ts` — parameterized test for all 19 dates, non-holiday edge cases
- [x] T1.5 Write `src/lib/__tests__/scheduleClassifier.test.ts` — 8 scenarios:
  - regular day (profile hours, no extra)
  - holiday day within expected hours (surcharge only)
  - **holiday day WITH overtime** — caso real: 13 julio 2026 (Ley 2578/2026) con
    perfil Mon-Fri 08:00-18:00+60min → 9h esperadas. 13h trabajadas = 9h
    `holidaySurcharge` + 4h `holidayDayOT` (115%). Verificar contra el cálculo
    manual ya validado (~$383.314 de total festivo). Sirve como test de regresión
    real, no teórico.
  - partial hour (30-min entry → 0.5h)
  - day-off (null entryTime → 0 para todas las categorías)
  - mixed day/night shift (spanning 19:00 boundary)
  - overtime on regular day (9h trabajadas con perfil 08:00-18:00+60min → 7h base + 2h OT)
  - multi-day aggregation across the fortnight

## Phase 2: UI Components (PR 2)

- [ ] T2.1 Create `src/pages/CalculatorPage/ScheduleProfileForm.tsx` — work days checkboxes (7 days), entry/exit time inputs (`HH:MM`), lunch break spinner with profile default callback
- [ ] T2.2 Create `src/pages/CalculatorPage/ScheduleProfileForm.module.css`
- [ ] T2.3 Create `src/pages/CalculatorPage/DayEntryForm.tsx` — date picker, per-day row with entry/exit/lunch overrides (pre-filled from profile), day-off toggle, add/remove day
- [ ] T2.4 Create `src/pages/CalculatorPage/DayEntryForm.module.css`
- [ ] T2.5 Write component tests — ScheduleProfileForm renders and calls onChange, DayEntryForm pre-fills from profile and toggles day-off

## Phase 3: Integration — Mode Toggle, Wiring, Storage (PR 3)

- [ ] T3.1 Add mode tabs (Manual/Schedule) to `PayrollForm.tsx` — conditional render of 7-field grid vs `ScheduleProfileForm` + `DayEntryForm`, with `inputMode` prop
- [ ] T3.2 Add `inputMode`, `scheduleProfile`, `workedDays` state + `useMemo` classifier bridge to `CalculatorPage.tsx` — clear opposite form on mode switch
- [ ] T3.3 Add `mode?`, `scheduleProfile?`, `workedDays?` to `SavedRecord` in `src/lib/types.ts`
- [ ] T3.4 Pass schedule fields to `saveRecord()` in `CalculatorPage.tsx` when mode is `'schedule'`
- [ ] T3.5 Write integration tests — mode toggle clears fields, save+load schedule record, legacy records load without error
