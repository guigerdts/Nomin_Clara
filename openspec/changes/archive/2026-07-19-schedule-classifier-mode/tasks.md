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

## Phase 1: Foundation — Types, Holidays, Classifier (PR 1) ✅

- [x] T1.1 Add `InputMode`, `DayOfWeek`, `ScheduleProfile`, `WorkedDay`, `ScheduleClassifierInput` to `src/lib/types.ts`
- [x] T1.2 Create `src/lib/holidays.ts` — 19 entries, `isHoliday()`, `getHolidayName()`, Ley 2578/2026 annotation
- [x] T1.3 Create `src/lib/scheduleClassifier.ts` — classification engine
- [x] T1.4 Holiday tests — 32 parameterized tests
- [x] T1.5 Classifier tests — 9 scenarios

## Phase 2: UI Components (PR 2) ✅

- [x] T2.1 Create `ScheduleProfileForm.tsx` — work days, entry/exit, lunch
- [x] T2.2 Create `ScheduleProfileForm.module.css`
- [x] T2.3 Create `DayEntryForm.tsx` — date picker + day rows pre-filled from profile
- [x] T2.4 Create `DayEntryForm.module.css`
- [x] T2.5 Component tests — 10 tests

## Phase 3: Integration (PR 3) ✅

- [x] T3.1 Mode tabs in PayrollForm
- [x] T3.2 CalculatorPage state + classifier bridge
- [x] T3.3 SavedRecord type update
- [x] T3.4 Save record with schedule fields + deductions
- [x] T3.5 Integration tests — 20 CalculatorPage tests

## Phase 4: Per-Day Schedule (Design Revision)

This phase modifies the existing ScheduleProfile to support per-day schedules instead of a single global schedule for all work days. It also adds migration for old-format profiles in localStorage.

- [x] **T4.1** `src/lib/types.ts` — Replace `entryTime`/`exitTime`/`lunchBreakMinutes` with `schedules: Partial<Record<DayOfWeek, DaySchedule>>`. Add `DaySchedule` interface (`{ entryTime, exitTime, lunchBreakMinutes }`).
- [x] **T4.2** `src/lib/scheduleClassifier.ts` — `scheduleClassifier()`: look up `profile.schedules[dayOfWeek]` instead of using a single `exp`. For each worked day, detect its day-of-week, find the DaySchedule for that day, compute expectedDayHours from THAT day's schedule.
- [x] **T4.3** `src/pages/CalculatorPage/ScheduleProfileForm.tsx` — Major rewrite:
  - Work day checkboxes remain (Lun-Sáb-Dom)
  - Each checked day shows its own entryTime/exitTime/lunchBreak inputs
  - Button "Usar mismo horario que..." to copy another day's schedule
  - When all checked days share identical schedules, collapse to a single view
  - Default: Mar-Vie 07:00-17:00+60min, Sáb 07:00-14:00+0min
- [x] **T4.4** `DayEntryForm.tsx` — Pre-fill new days from `profile.schedules[dayOfWeek(date)]` instead of profile's single entryTime/exitTime
- [x] **T4.5** `CalculatorPage.tsx` — Migration logic: `migrateProfile()` function added for old-format ScheduleProfile conversion. Imported `DaySchedule` type.
- [x] **T4.6** `scheduleClassifier.test.ts` — Add test: **mixed per-day schedules**. Profile: Mon-Fri 07:00-17:00+60 (9h), Saturday 07:00-14:00+0 (7h). Worker works 8h on Saturday → 2h dayOT. Worker works 10h on Monday → 1h dayOT. Also updated existing profiles to new format.
- [x] **T4.7** Component test updates — `DayEntryForm.test.tsx`: verify pre-fill picks the correct DaySchedule per day-of-week. `ScheduleProfileForm.test.tsx`: verify toggling Saturday shows its own time inputs.
