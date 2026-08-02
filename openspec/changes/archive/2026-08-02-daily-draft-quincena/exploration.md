## Exploration: Daily Log with Auto-Save (DraftQuincena)

### Current State

The app today is a **one-shot payroll calculator**: users enter hours, calculate, then save as a final `SavedRecord`. There is no incremental/day-by-day workflow.

**Key files and their roles:**

- **`src/lib/types.ts`** — Defines `SavedRecord` (closed/final), `WorkedDay`, `ScheduleProfile`, `PayrollInput`, etc. The `SavedRecord` already carries optional `scheduleProfile` and `workedDays` fields. No `DraftQuincena` type exists yet.

- **`src/lib/storage.ts`** — Simple localStorage wrapper with `saveRecord()`, `getAllRecords()`, etc. Storage key: `nomina-clara-records`. Persists `SavedRecord[]` as a flat array. No draft concept exists.

- **`src/lib/scheduleClassifier.ts`** — Pure function that takes `ScheduleClassifierInput` (profile + workedDays + salary) and produces a `PayrollInput`. This is used only in Schedule Mode to aggregate all worked days into hour totals. **The user explicitly said no changes to this file.**

- **`src/pages/CalculatorPage/CalculatorPage.tsx`** — Main orchestrator. Manages state for inputs, results, deductions, mode (`manual`/`schedule`), `scheduleProfile`, and `workedDays`. The save flow (`handleSave`) constructs a `SavedRecord` with all fields and calls `saveRecord()` from storage. Fortnight detection is inline in `handleSave` (lines 166-173): `day <= 15` → starts 1st, else starts 16th.

- **`src/pages/CalculatorPage/PayrollForm.tsx`** — Renders the form. Has the mode toggle (Manual / Horario Detallado) and conditionally renders either the manual hours grid or `ScheduleProfileForm` + `DayEntryForm`. The "Horario Detallado" section is where the new "Hoy" section would go.

- **`src/pages/CalculatorPage/DayEntryForm.tsx`** — The day-by-day entry form for schedule mode. Users add dates, see per-day entry/exit/lunch fields, toggle day-off. Supports add/update/remove. **Important:** it prevents duplicate dates in its `addDay` function (line 28: `days.some(d => d.date === newDate)`). The data flows upward via `onChange(days: WorkedDay[])`.

- **`src/hooks/useLocalStorage.ts`** — Generic `useLocalStorage<T>(key, initialValue)` hook. Returns `[value, setter]`, reads from localStorage on init, writes on every update via the setter. **This is the exact pattern the new `useDraftQuincena` hook should follow or wrap.**

- **`src/hooks/useTheme.ts`** — Theme management hook. Not directly relevant.

- **Test files:** `CalculatorPage.test.tsx` (integration tests, localStorage mocking via `localStorage.clear()` in `beforeEach`), `DayEntryForm.test.tsx` (unit tests with `vi.fn()`). Test setup: `vitest` + `@testing-library/react` + `jsdom`.

### Affected Areas

- **`src/lib/types.ts`** — Add `DraftQuincena` type with `{ id, startDate, workedDays, lastUpdated }` (no `endDate` — the draft is "in progress" until closed).
- **`src/hooks/useDraftQuincena.ts`** — New hook. Wraps `useLocalStorage` or directly uses `useState` + `useEffect` to auto-persist. Must handle: current fortnight detection, add/update/remove worked day, running total calculation, and "close fortnight" conversion to `SavedRecord`.
- **`src/pages/CalculatorPage/PayrollForm.tsx`** — Add a "Hoy" (Today) section at the top of the Schedule Mode UI. Quick add for today's date, progress dashboard, and (on last day) "Close fortnight & save" button.
- **`src/pages/CalculatorPage/CalculatorPage.tsx`** — Wire the `useDraftQuincena` hook, integrate the "Hoy" section, handle the "close fortnight" action that creates a `SavedRecord` via the existing `saveRecord()`.
- **`src/lib/storage.ts`** — Optionally add a draft-specific storage function or key. The hook manages its own localStorage key (e.g. `nomina-clara-draft-quincena`).
- **`src/pages/CalculatorPage/DayEntryForm.tsx`** — Possibly minor: the existing day form could be reused for the daily entry, or the "Hoy" section could be standalone.
- **`src/pages/CalculatorPage/__tests__/`** — New test file for draft quincena persistence and close flow.

### Approaches

1. **Standalone "Hoy" section outside DayEntryForm** — New React component placed inside `PayrollForm.tsx` above the existing `DayEntryForm`. Has its own state from `useDraftQuincena`. Quick-add today button, progress summary, close button.
   - Pros: Clean separation, doesn't modify `DayEntryForm` logic, reuses `WorkedDay` type
   - Cons: Two sources of worked days (draft vs. DayEntryForm's local state), could confuse users
   - Effort: **Medium**

2. **Unified: DayEntryForm reads from draft** — `DayEntryForm` becomes driven by the draft. The "Hoy" section is part of a new parent component that manages both quick-add and the full day list via the draft hook. DayEntryForm still exists as the list renderer but receives data from the draft.
   - Pros: Single source of truth for worked days, no duplicate state
   - Cons: More refactoring of existing components, higher risk of breaking schedule mode
   - Effort: **High**

3. **Draft-as-sidecar — minimal changes** — Keep `DayEntryForm` exactly as-is. The "Hoy" section is a <details>/collapsible card in `PayrollForm` that uses `useDraftQuincena` independently. Worked days entered via "Hoy" auto-save to draft localStorage. The manual day list below is unaffected. On close, the draft days are merged into the current mode's calculation.
   - Pros: Minimal risk to existing code, clear separation, quick to implement
   - Cons: Two separate day-entry UIs could be confusing; draft days not visible in the main DayEntryForm
   - Effort: **Low-Medium**

### Recommendation

**Approach 1** — Standalone "Hoy" section, placed inside `PayrollForm.tsx` below the mode toggle but above `DayEntryForm`. The draft is independent from the calculation classifier (no changes to `scheduleClassifier` as requested). When the user clicks "Calculate", the main `DayEntryForm` data is still what feeds `scheduleClassifier()`. The draft is purely a convenience for incremental logging.

**Rationale:**
- No changes to `scheduleClassifier()` or `calculateBreakdown()` — as explicitly requested
- No risk of breaking the existing Schedule Mode flow
- Clean separation of concerns: draft persistence (auto-save) vs. calculation (triggered by "Calculate" button)
- The `useLocalStorage` hook serves as a direct blueprint for `useDraftQuincena`
- The "Close fortnight" action constructs a `SavedRecord` by taking the current `inputs` + `breakdown` from the calculator and adding `workedDays` from the draft, then calling `saveRecord()`

**DraftQuincena lifecycle:**

```
User enters a day → useDraftQuincena.addDay(workedDay)
                     → updates state
                     → auto-persists to localStorage (key: nomina-clara-draft-{quincenaStart})

User edits a day  → useDraftQuincena.updateDay(date, partial)
                     → same auto-persist

User clicks "Close fortnight & save":
  → closes the draft: removes from localStorage
  → creates SavedRecord from current calculator state
  → adds workedDays from draft
  → calls existing saveRecord() from storage.ts
  → new SavedRecord appears in history

Page refresh:
  → useDraftQuincena reads draft from localStorage
  → restores state, shows progress
```

### Risks

- **Stale draft after fortnight ends**: The draft auto-detects the current fortnight on mount. If a user leaves a draft from last fortnight, what happens? **Action**: On init, if the draft's `startDate` doesn't match the current fortnight, clear it silently or show a notice.
- **Duplicate dates**: If user adds "today" via the Hoy section and also adds the same date in the DayEntryForm below, both exist. **Action**: The draft manages its own deduplication (upsert by date). The existing `DayEntryForm` also deduplicates. The two lists are independent.
- **Close fortnight without calculating**: The user might click "Close" without having clicked "Calculate" first. **Action**: The close button should trigger a calculation or warn if no result exists yet.
- **localStorage quota**: Heavy use of auto-save on every keystroke could hit quota. **Action**: Save only on add/update/remove, not on every keystroke within a field. Debounce if needed.
- **Timezones**: `new Date().getDate()` for fortnight detection is client-local. This is acceptable for an SPA.

### Ready for Proposal

**Yes.** The exploration is complete. Tell the user:
- The existing architecture has a clear pattern (`useLocalStorage` hook) that can be directly reused
- No changes to `scheduleClassifier()` or `calculateBreakdown()` are needed — the draft is purely a persistence + UX layer
- The `SavedRecord` type already has optional `workedDays`, making the "Close & Save" flow straightforward
- The recommended approach adds a standalone "Hoy" section to the Schedule Mode UI without refactoring existing components
- Implementation order: types → hook → component → CalculatorPage integration → tests
