## Exploration: Schedule Classifier Mode

### Current State

**How hours are currently entered:**
The user manually enters hours into 7 separate numeric fields in `PayrollForm.tsx`, each corresponding to one of the 7 legal Colombian payroll concepts:

| Field | Concept | Legal Ref |
|-------|---------|-----------|
| `dayOT` | Hora extra diurna (+25%) | CST Art. 179 |
| `nightOT` | Hora extra nocturna (+75%) | CST Art. 179, Ley 2466 |
| `nightSurcharge` | Recargo nocturno ordinario (+35%) | CST Art. 168 |
| `holidayDayOT` | Hora extra diurna dom/fest (+115%) | CST Art. 179, Ley 2466 |
| `holidayNightOT` | Hora extra nocturna dom/fest (+165%) | CST Art. 179, Ley 2466 |
| `holidaySurcharge` | Recargo dom/fest ordinario (+90%) | CST Art. 179 |
| `holidayNightSurcharge` | Recargo nocturno + festivo (+125%) | CST Art. 168, 179 |

**How `calculateBreakdown()` works:**
A pure function in `src/lib/rates.ts` that takes a `PayrollInput` and:
1. Computes `hourValue = (salary / 30) / 7` (legal daily hours)
2. Determines transport allowance eligibility (≤ 2 SMMLV)
3. Calls `makeEntry()` for each of the 7 concepts where hours > 0
4. `makeEntry()` calculates `subtotal = hours × hourValue × multiplier` and `surchargeOnly = hours × hourValue × (multiplier - 1)`
5. For OT entries, `extraTotal` accumulates the full `subtotal`; for surcharge-only entries, it accumulates only `surchargeOnly` (base pay already covers ordinary time)
6. Returns `BreakdownResult` with entries array + totals

**Rates structure:**
```typescript
RATES = {
  WEEKLY_HOURS: 42,
  DAILY_HOURS: 7,
  DAY_START: 6,   // 6:00am
  DAY_END: 19,     // 7:00pm
  SURCHARGES: { NIGHT: 0.35, OT_DAY: 0.25, OT_NIGHT: 0.75, HOLIDAY: 0.90,
    HOLIDAY_NIGHT: 1.25, HOLIDAY_OT_DAY: 1.15, HOLIDAY_OT_NIGHT: 1.65 },
  MULTIPLIERS: { NIGHT: 1.35, OT_DAY: 1.25, OT_NIGHT: 1.75, HOLIDAY: 1.90,
    HOLIDAY_NIGHT: 2.25, HOLIDAY_OT_DAY: 2.15, HOLIDAY_OT_NIGHT: 2.65 },
  LIMITS: { MAX_OT_PER_DAY: 2, MAX_OT_PER_WEEK: 12 },
}
```

**Persistence:**
Records are saved to `localStorage` as `SavedRecord[]` under key `nomina-clara-records`. Each record stores `inputs` (the `PayrollInput`) and `breakdown` (the computed `BreakdownEntry[]`).

**Holidays:**
There is **no existing holiday list** in the codebase. Colombian holidays depend on both fixed dates and Easter-based calculations (some holidays shift to the following Monday). A holiday module must be created from scratch.

### Affected Areas

| File | Change Required | Why |
|------|----------------|-----|
| `src/lib/types.ts` | **Add** `ScheduleProfile`, `DayOfWeek`, `WorkedDay`, `ScheduleClassifierInput` types | Foundation data structures for the schedule classifier domain |
| `src/lib/holidays.ts` | **Create** — Colombian holiday list with calculation functions | No existing holiday data; needed to determine which days are holiday vs ordinary |
| `src/lib/scheduleClassifier.ts` | **Create** — pure classification engine | Core logic: takes schedule profile + actual worked days → produces category hour counts |
| `src/lib/rates.ts` | **No change** | Classifier feeds INTO `calculateBreakdown()`, doesn't modify it |
| `src/lib/constants.ts` | **No change** | Constants are already defined |
| `src/lib/storage.ts` | **Minor** — maybe update `SavedRecord` to store schedule profile for audit trail | So saved records can be reclassified later or show the schedule used |
| `src/pages/CalculatorPage/CalculatorPage.tsx` | **Modify** — add mode toggle state, schedule state, classification bridge | Central orchestrator needs to manage both manual and schedule modes |
| `src/pages/CalculatorPage/PayrollForm.tsx` | **Modify** — add mode selector (manual/schedule) | User needs to choose input mode at the top of the form |
| `src/pages/CalculatorPage/ScheduleProfileForm.tsx` | **Create** — form to configure weekly schedule template | Main schedule configuration UI (workdays, times, breaks) |
| `src/pages/CalculatorPage/DayEntryForm.tsx` | **Create** — form to enter actual worked days/hours | Day-by-day actual time entry for the fortnight |
| `src/pages/CalculatorPage/ResultsCard.tsx` | **No change** | Uses `BreakdownResult` — no dependency on input method |
| `src/pages/CalculatorPage/BreakdownTable.tsx` | **No change** | Pure render of `BreakdownResult` |
| `src/pages/ComparePage/ComparePage.tsx` | **No change** | Reads `SavedRecord` — backward compatible |
| `src/lib/__tests__/scheduleClassifier.test.ts` | **Create** | Unit tests for the classification engine |
| `src/lib/__tests__/holidays.test.ts` | **Create** | Unit tests for holiday list/isHoliday() |
| `src/pages/CalculatorPage/__tests__/CalculatorPage.test.tsx` | **Update** | Add tests for schedule mode integration |

### Approaches

#### 1. Full Schedule Classifier Engine (pure function in lib/)

A pure function in `src/lib/scheduleClassifier.ts` that takes:
- `ScheduleProfile` (weekly template: workdays, start/end times, lunch break)
- `WorkedDay[]` (actual clock-in/clock-out per day for the fortnight)
- Holiday check via `isHoliday(date)`

And returns a `PayrollInput`-compatible object (the 7 category hour counts), which then feeds into `calculateBreakdown()` without any modification.

**Architecture:**
```
User input (schedule profile + day entries)
    ↓
scheduleClassifier()  ←  holidays.isHoliday()
    ↓                       ↓
PayrollInput (7 fields)   HolidayList
    ↓
calculateBreakdown()  [unchanged]
    ↓
BreakdownResult → render
```

**Pros:**
- Zero modification to the existing calculation pipeline
- Clean separation of concerns (input method vs. calculation)
- The classifier can be tested independently
- The schedule profile can be saved for audit/recall
- Highly reusable — could power a future "time clock" integration

**Cons:**
- More initial work than a quick inline solution
- Need to build a holiday calculation module from scratch
- Colombian holiday rules (Easter-based, "Ley de Puente Festivo" Monday rule) are complex

**Effort:** Medium (2-3 focused sessions)

---

#### 2. Simplified Daily-Row Input Mode

Instead of a full schedule profile with times, add a simpler mode where the user enters a row per day with:
- Date
- Total hours worked
- Whether it was a holiday or not

Then the classifier distributes those hours into categories based on simple rules (e.g., first 7 hours are ordinary, rest is OT, night hours after 7pm).

**Pros:**
- Simpler UI (no time-pickers, no lunch breaks)
- Easier to implement holiday list
- Less data entry for the user

**Cons:**
- Less accurate (can't distinguish early-arrival night surcharge from overtime)
- Less "magical" — the user still does some manual thinking
- Still needs the holiday detection

**Effort:** Low-Medium (1-2 sessions)

---

#### 3. Hybrid: Schedule Profile + Manual Override

Approach 1 + the ability to manually tweak any category after auto-classification. The user can see the classified result and adjust individual category hours.

**Pros:**
- Catches edge cases the classifier might miss
- Gives user confidence (they can verify and correct)
- Better UX for power users

**Cons:**
- Significantly more complex UI (classified fields + manual edit mode)
- Risk of "why did it classify wrong?" confusion
- More state management

**Effort:** High (3-4 sessions)

### Recommendation

**Approach 1 (Full Schedule Classifier Engine)** with a lighter initial holiday module.

Rationale:
- The core value proposition is "the app does the classification work" — Approach 1 delivers that fully
- Approach 2 doesn't save enough mental effort to justify the mode switch
- Approach 3 can be layered on later as a v2 enhancement
- The existing codebase's architecture (pure functions in lib/, separate UI components) naturally supports this approach
- `calculateBreakdown()` is already a pure function with a clean interface — the classifier feeds it without touching it

**Phase the holiday work:**
1. First: Fixed-date Colombian holidays + a manual `isHoliday()` function
2. Later: Add Easter-dependent holiday calculation (requires computus algorithm)

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Colombian holiday complexity** | Easter-based holidays + "Ley de Puente Festivo" (Emiliani law) require year-specific calculation | Start with fixed-date holidays only; mark Easter-dependent as TODO with fallback to manual override |
| **Scope creep from UI complexity** | ScheduleProfile form + DayEntry grid + mode toggle could balloon the UI | Ship the mode toggle + schedule profile first, then day-entry grid in follow-up |
| **Edge cases in classification** | Partial hours, early clock-in, late clock-out straddling day/night boundaries | Classifier operates at 30-minute granularity initially; handle fractional hours |
| **Record backward compatibility** | Existing saved records don't have schedule profiles | Old records work fine (they have `inputs.PayrollInput` already); new records optionally store the profile |
| **User confusion about modes** | "When do I use manual vs. schedule?" | Add a brief description at the mode toggle explaining each mode's use case (e.g., "Tenés horario fijo" vs "Tus horas varían cada día") |
| **Date/time input complexity** | Time pickers, lunch breaks, date range selection for quincena | Use simple inputs initially (text HH:MM fields), add UX polish later |

### Ready for Proposal

**Yes** — full proposal can be created from this exploration. The architecture is clear: a pure classification function in `lib/` that produces `PayrollInput`, feeding into the unchanged `calculateBreakdown()`. The key deliverables are:

1. `src/lib/holidays.ts` — holiday list and `isHoliday()` function
2. `src/lib/scheduleClassifier.ts` — the classification engine
3. New types in `src/lib/types.ts`
4. `src/pages/CalculatorPage/ScheduleProfileForm.tsx` — schedule configuration UI
5. `src/pages/CalculatorPage/DayEntryForm.tsx` — day-by-day entry UI
6. Mode toggle integration in `CalculatorPage.tsx` and `PayrollForm.tsx`
7. Unit tests for the pure functions
