# Verify Report: Schedule Classifier Mode

**Status**: partial
**Date**: 2026-07-19
**Verified against**: proposal.md, design.md, tasks.md

---

## Executive Summary

**187/187 tests pass** (10 test files, all green). The schedule classifier engine, holiday detector, UI components, and integration wiring all work correctly. **One TypeScript compilation error** blocks a clean build: `scheduleProfile` state typed as `ScheduleProfile | null` is spread into `saveRecord()` which expects `ScheduleProfile | undefined`, and strict mode rejects `null`. This is a minor type-narrowing issue in `CalculatorPage.tsx:172`.

---

## Command Results

| Command | Exit Code | Output Hash |
|---------|-----------|-------------|
| `npx vitest run` | 0 | `b2649fc63540dd67b41ec24d90aa3b381afdfcb73ffbe45658b2195e18af3ba3` |
| `npx tsc --noEmit` | 2 | `acdbb69a72b0ada6bf16b1e2737d0fd6ad974998ab51c39b04dd4e384c2ec6aa` |

---

## Success Criteria Verification

### ✅ 1. User can configure a weekly schedule profile and enter worked days

- `ScheduleProfileForm.tsx` — work day checkboxes (7), entry/exit times (`HH:MM`), lunch break spinner, time validation
- `DayEntryForm.tsx` — date picker, per-day pre-filled rows from profile, day-off toggle, remove button, duplicate-date guard
- Component tests: ScheduleProfileForm (4 tests) ✅, DayEntryForm (6 tests) ✅

### ✅ 2. scheduleClassifier() correctly distributes hours into 7 legal concepts

9 tests in `scheduleClassifier.test.ts` covering:

| Scenario | Result | Evidence |
|----------|--------|----------|
| Regular day, within expected → zero fields | ✅ | `toMatchObject(zero)` |
| Holiday within expected → `holidaySurcharge=9` | ✅ | Exact assertion |
| Holiday WITH overtime (Ley 2578/2026, July 13) | ✅ | 9h surcharge + 2.5h holidayDayOT + 1.5h holidayNightOT |
| Non-work day + holiday → ALL `holidayDayOT` (115%) | ✅ | 9h holidayDayOT, verified with `calculateBreakdown()` monetary check (~$191,657) |
| Partial hour (30-min) | ✅ | `toMatchObject(zero)` |
| Day off (null entry) | ✅ | All fields zero |
| Mixed day/night shift spanning 19:00 | ✅ | 3h `nightSurcharge` |
| Overtime on regular day (11h worked / 9h expected) | ✅ | 2h `dayOT` |
| Multi-day aggregation (3 days) | ✅ | 2h dayOT + 9h holidaySurcharge |

### ✅ 3. All 19 Colombian holidays 2026 detected correctly

- `holidays.ts`: 19 entries including `2026-07-13` annotated with `isNewLaw: true` and Ley 2578/2026 comment
- `isHoliday()` parameterized test covers all 19 dates ✅
- `isHoliday()` accepts `Date` objects ✅
- `getHolidayName()` returns correct names ✅
- Non-holiday edge cases (regular Monday, Feb 29 non-leap, Dec 26, empty string) ✅
- Total: 32 tests in `holidays.test.ts`

### ✅ 4. Mode toggle switches between manual and schedule forms cleanly

- `PayrollForm.tsx`: two-button toggle (Manual / Horario Detallado) with `modeBtnActive` styling
- Conditional render: manual → 7-field grid, schedule → `ScheduleProfileForm` + `DayEntryForm`
- `handleInputModeChange` clears opposite form state (nulls profile/days or resets inputs)
- Integration test `"toggles mode tabs and renders schedule/manual forms"` ✅

### ✅ 5. All 187 tests pass

```
Test Files  10 passed (10)
Tests       187 passed (187)
```

| Test File | Tests | Status |
|-----------|-------|--------|
| `rates.test.ts` | 34 | ✅ |
| `deductions.test.ts` | 43 | ✅ |
| `storage.test.ts` | 21 | ✅ |
| `importExport.test.ts` | 9 | ✅ |
| `holidays.test.ts` | 32 | ✅ |
| `scheduleClassifier.test.ts` | 9 | ✅ |
| `CalculatorPage.test.tsx` | 20 | ✅ |
| `ScheduleProfileForm.test.tsx` | 4 | ✅ |
| `DayEntryForm.test.tsx` | 6 | ✅ |
| `ComparePage.test.tsx` | 9 | ✅ |

### ✅ 6. Saved records mark which mode was used, deductions survive both modes

- Integration test `"saves record with schedule mode, deductions, and schedule fields"` ✅
  - `mode: 'schedule'`, `scheduleProfile` with workDays, `workedDays` with date `2026-07-13`
  - `deductionsInput` preserved (`includeHealthPension: true`)
  - `splitMode` preserved (`'even'`)
  - `inputs` with salary populated
- Deductions persistence is mode-independent — both modes write identical `SavedRecord` shape

### ✅ Legacy record backward compatibility

- Record without `deductionsInput` loads without crash ✅
- Record with `deductionsInput`/`splitMode` but no `mode`/`scheduleProfile` loads without crash ✅
- Record rendering continues normally for both legacy types

---

## Edge Cases Verification

| Edge Case | Status | Notes |
|-----------|--------|-------|
| Regular day (all within expected → zero) | ✅ | All 7 fields `0` |
| Holiday within expected → holidaySurcharge | ✅ | 9h holidaySurcharge |
| Holiday WITH overtime on non-work day → 115% | ✅ | 9h holidayDayOT, monetary check against `calculateBreakdown()` |
| Day off (null entry → all zero) | ✅ | All fields zero |
| Mixed day/night shift spanning 19:00 | ✅ | 3h nightSurcharge, correct day/night split |
| Multi-day aggregation | ✅ | 2h dayOT + 9h holidaySurcharge summed |
| Legacy records load without error | ✅ | Both pre-deductions and pre-schedule records |

---

## ❌ TypeScript Error (1 issue)

### Location
`src/pages/CalculatorPage/CalculatorPage.tsx:178:18`

### Error
```
Argument of type '{ scheduleProfile?: ScheduleProfile | null | undefined; ... }' 
is not assignable to parameter of type 'Omit<SavedRecord, "id" | "createdAt">'.
  Types of property 'scheduleProfile' are incompatible.
    Type 'ScheduleProfile | null | undefined' is not assignable to type 'ScheduleProfile | undefined'.
      Type 'null' is not assignable to type 'ScheduleProfile | undefined'.
```

### Root Cause
On line 172, the spread `...(inputMode === 'schedule' && { scheduleProfile, workedDays })` passes `scheduleProfile` which is state-typed as `ScheduleProfile | null`. However, `SavedRecord.scheduleProfile` is typed as `ScheduleProfile | undefined`. TypeScript strict mode rejects `null` being assigned to a field typed as `ScheduleProfile | undefined`.

### Fix
In `CalculatorPage.tsx`, change the spread on lines 171-174 to filter out `null`:
```typescript
...(inputMode === 'schedule' && scheduleProfile && {
  scheduleProfile,
  workedDays,
}),
```
This ensures `scheduleProfile` is never `null` when spread into the record, which satisfies the `ScheduleProfile | undefined` type.

---

## Code Quality Assessment

### Schedule Classifier (`scheduleClassifier.ts`)
- Pure function with no side effects ✅
- 30-min block iteration for day/night split ✅
- 2-decimal truncation via `t2()` ✅
- Non-work days get `adjExp = 0` → ALL hours become OT ✅
- Holiday detection per day via `isHoliday()` ✅
- Clean separation: `classifyDay()` per day, `scheduleClassifier()` aggregates ✅

### Holiday Module (`holidays.ts`)
- 19 Colombian holidays for 2026 ✅
- Ley 2578/2026 annotation for July 13 ✅
- `normalizeDate()` accepts both string and Date ✅
- Empty string / invalid date handled gracefully (returns false/null) ✅

### UI Components
- `ScheduleProfileForm`: controlled form, time validation, null→default fallback ✅
- `DayEntryForm`: pre-fills from profile, day-off toggle, duplicate prevention, remove button ✅
- `PayrollForm`: mode toggle with conditional render, clear switch state ✅
- `CalculatorPage`: `useMemo` for classifier bridge, `useEffect` auto-trigger, mode-clear logic ✅

### Storage
- `SavedRecord` optional fields: `mode?`, `scheduleProfile?`, `workedDays?` ✅
- Backward compatible: old records lack these fields ✅
- Storage functions unchanged (`saveRecord()`, `getAllRecords()`, etc.) ✅

---

## Risks

| Risk | Status |
|------|--------|
| Colombian holiday complexity | Mitigated — fixed-date only for 2026, Easter-based marked for v2 |
| UI scope creep | Contained — mode toggle + profile + day-entry in scope |
| Edge cases in classification | Covered by 9 test scenarios |
| Record backward compatibility | ✅ Verified in integration tests |
| **TypeScript strict mode** | ⚠️ One null/undefined mismatch in save record spread — trivial fix |

---

## Summary

```
overall: partial (tests pass, but TS build fails)
  ├── tests:       187/187 passed ✅
  ├── build:       tsc --noEmit fails with 1 error ❌
  ├── classifier:  9 tests covering all matrix cells ✅
  ├── holidays:    19/19 dates, 32 tests ✅
  ├── components:  10 component tests ✅
  ├── integration: 20 CalculatorPage tests ✅
  └── legacy:      backward compatible ✅
```

**Next**: Fix the single TypeScript error (`null` vs `undefined` in save record spread), then re-verify with `npx tsc --noEmit` and `npx vitest run`.
