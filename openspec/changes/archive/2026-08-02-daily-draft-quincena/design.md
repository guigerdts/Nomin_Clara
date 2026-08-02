# Design: Daily Draft Quincena

## Technical Approach

A self-contained "Hoy" section inside `PayrollForm` (schedule mode only) that uses a new `useDraftQuincena` hook wrapping `useLocalStorage`-style persistence. Draft lives in its own localStorage key, independent from the existing `DayEntryForm`/classifier flow. Close fortnight converts draft data into a `SavedRecord` via the existing `saveRecord()` path.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `useDraftQuincena` hook vs inline in PayrollForm | Hook is testable, reusable, encapsulates fortnight math | **Hook** — follows established `useLocalStorage` pattern |
| Separate key per fortnight vs single key | Separate keys avoid stale-data collision, enable per-fortnight detection | **`nomina-clara-draft-{startDate}`** — matches proposal |
| Auto-clear stale draft vs confirmation dialog | Auto-clear is simpler but loses user data silently | **Confirmation dialog** — user must explicitly close or discard |
| Dedicated close button vs repurpose "Guardar registro" | Repurpose conflates draft close with normal save; dedicated is explicit | **"Cerrar quincena & save"** — separate action in Hoy section |
| Delete draft key vs mark-as-closed field | Deleting is simpler, no migration needed | **Delete key** — ephemeral data, no ghost state |

## Data Model

Add to `src/lib/types.ts`:

```typescript
export interface DraftQuincena {
  id: string;             // same generateId() pattern from storage.ts
  startDate: string;      // ISO date of fortnight start
  endDate: string;        // ISO date of fortnight end
  workedDays: WorkedDay[];// same type used by DayEntryForm
  lastUpdated: string;    // ISO datetime
}
```

Reuses `WorkedDay` directly — no field duplication. `startDate`/`endDate` enable stale detection by comparing against the computed current fortnight.

## Hook API

`src/hooks/useDraftQuincena.ts` — return type:

| Member | Type | Behavior |
|--------|------|----------|
| `draft` | `DraftQuincena \| null` | Current draft or null |
| `addDay` | `(day: WorkedDay) => void` | Upserts by date — if date exists, update fields; else append |
| `updateDay` | `(date: string, updates: Partial<WorkedDay>) => void` | Partial merge on existing entry |
| `removeDay` | `(date: string) => void` | Filters out matching date |
| `closeDraft` | `() => SavedRecord \| null` | Builds SavedRecord from latest state + draft days; deletes key |
| `discardDraft` | `() => void` | Deletes draft key, resets to null |
| `progress` | `{ registered: number; total: number }` | `total = endDate - startDate + 1` (dynamic) |
| `staleDraftInfo` | `{ exists: boolean; startDate: string; endDate: string } \| null` | Non-null when draft.startDate ≠ currentFortnight.startDate |

Fortnight math (extracted as pure function for testing):

```
day ≤ 15 → start = YYYY-MM-01, end = YYYY-MM-15
day > 15 → start = YYYY-MM-16, end = lastDayOfMonth(YYYY, MM)
```

## Data Flow

```
[User clicks "Agregar hoy"]
  → addDay({ date: today, entryTime, exitTime, lunchBreakMinutes })
    → upsert by date in draft.workedDays
      → localStorage.setItem(key, JSON.stringify(draft))

[User clicks "Cerrar quincena & save"]
  → closeDraft()
    → reads current calculator inputs + breakdown (from parent state)
    → builds SavedRecord(quincena: draft.startDate, workedDays: draft.workedDays)
    → localStorage.removeItem(draftKey)
    → calls parent's onSave(record) which calls saveRecord() from storage.ts

[Page refresh mid-fortnight]
  → useDraftQuincena mount
    → reads draft key from localStorage
    → computes current fortnight start
    → draft.startDate === currentStart ? normal : staleDraftInfo set
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/types.ts` | Modify | Add `DraftQuincena` interface |
| `src/hooks/useDraftQuincena.ts` | Create | Hook: draft lifecycle, stale detection, close/discard |
| `src/pages/CalculatorPage/PayrollForm.tsx` | Modify | Add "Hoy" section below mode toggle when `inputMode === 'schedule'` |
| `src/pages/CalculatorPage/CalculatorPage.tsx` | Modify | Pass `onCloseFortnight` handler; wire closeDraft → saveRecord |
| `src/hooks/__tests__/useDraftQuincena.test.ts` | Create | Pure hook tests (localStorage mock) |
| `src/pages/CalculatorPage/__tests__/CalculatorPage.test.tsx` | Modify | Add draft flow integration tests |

## Stale Draft Flow

```
[useDraftQuincena mounts]
  ├─ draft.startDate === currentFortnight.startDate
  │   └─ normal mode — show Hoy section
  └─ draft.startDate !== currentFortnight.startDate
      └─ staleDraftInfo = { exists: true, startDate, endDate }
          ├─ User clicks "Cerrar" → closeDraft() → saveRecord → discardDraft()
          └─ User clicks "Descartar" → discardDraft() → delete key, dismiss dialog
```

Dialog text (hardcoded in PayrollForm):
> "Tienes un registro sin cerrar del {startDate} al {endDate}. ¿Querés cerrarlo ahora o descartarlo?"

## Calculation Integration

- "Calculate" button continues reading from `DayEntryForm` — **unchanged**
- "Cerrar quincena & save" in Hoy section is a separate action
- `closeDraft()` receives `inputs`, `breakdown`, `alias`, etc. from parent via callback — assembles `SavedRecord` shape, calls `saveRecord()`, deletes draft key
- If no breakdown available (never calculated), show warning before close

## Interfaces / Contracts

### CloseDraft callback (CalculatorPage → PayrollForm)

```typescript
onCloseFortnight?: (record: DraftSavePayload) => void;

interface DraftSavePayload {
  workedDays: WorkedDay[];
  startDate: string;
}
```

CalculatorPage receives this, builds full SavedRecord (reusing its existing `handleSave` logic but substituting draft `workedDays` for `workedDays`).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Fortnight math (start/end computation) | Pure function tests: Jan 1st-15th, Jan 16th-31st, Feb non-leap, Feb leap, month with 31 days |
| Unit | Draft upsert logic | addDay same date → updates; addDay new date → appends; updateDay partial merge |
| Unit | Stale detection | Draft from previous fortnight → staleDraftInfo set; current fortnight → no stale info |
| Unit | closeDraft builds correct SavedRecord | Mock saveRecord, verify shape, verify draft key removed |
| Unit | discardDraft | Verify key removed, state null |
| Integration | Draft survives page refresh | Render, add day, unmount, re-render → draft restored |
| Integration | Stale draft dialog shows on mount | Pre-set localStorage with old fortnight, render → dialog appears |
| Integration | "Cerrar quincena & save" end-to-end | Fill salary, switch to schedule, add draft day, close → SavedRecord in history |
| Regression | All existing tests pass | `npx vitest run` before and after |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Draft keys are ephemeral — first access creates a fresh draft. Existing saved records are untouched.

## Open Questions

None.
