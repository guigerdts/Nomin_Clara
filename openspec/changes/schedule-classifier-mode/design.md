# Design: Schedule Classifier Mode

## Technical Approach

Pure function pipeline — no changes to `calculateBreakdown()` or any existing lib logic. New schedule domain types in `types.ts`, a holiday detector in `holidays.ts`, and `scheduleClassifier.ts` as the classification engine. UI layer adds a mode toggle (Manual ↔ Schedule) in `PayrollForm.tsx`, two new form components, and state management in `CalculatorPage.tsx`.

```
ScheduleProfileForm ─┐
                     ├──→ scheduleClassifier() ──→ PayrollInput ──→ calculateBreakdown() ──→ render
DayEntryForm ────────┘         ↑
                         holidays.isHoliday()
```

## Architecture Decisions

### Decision: Classification lives in a pure lib function

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline in component | Tight coupling, untestable | ❌ |
| Pure function in `lib/` | Testable, matches rates.ts/deductions.ts pattern | ✅ |
| Class-based engine | Overkill for 7-category output | ❌ |

### Decision: Hardcoded holiday list for 2026 (same pattern as constants.ts)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Dynamic computus algorithm | Correct for all years, but complex and unused beyond 2026 | ❌ |
| Hardcoded 2026 list | Same maintenance pattern as SMMLV/UVT; yearly manual update | ✅ |

### Decision: 30-min granularity fractional-hour output

All times input as HH:MM, internally converted to fractional hours (30-min blocks). Final category hours are truncated to 2 decimals to avoid IEEE 754 artifacts in the UI.

## Types (`src/lib/types.ts`)

```typescript
export type InputMode = 'manual' | 'schedule';
export type DayOfWeek = 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';

export interface ScheduleProfile {
  workDays: DayOfWeek[];
  entryTime: string;          // "08:00"
  exitTime: string;           // "18:00"
  lunchBreakMinutes: number;  // 60
}

export interface WorkedDay {
  date: string;               // "2026-07-01"
  entryTime: string | null;   // null = day off
  exitTime: string | null;
  lunchBreakMinutes: number | null; // null = use profile default
}

export interface ScheduleClassifierInput {
  profile: ScheduleProfile;
  workedDays: WorkedDay[];
  salary: number;
}
```

## Holiday Module (`src/lib/holidays.ts`)

```typescript
export interface Holiday {
  date: string;      // "2026-07-13" (ISO)
  name: string;      // "Virgen de Chiquinquirá"
  isNewLaw?: true;   // flag for Ley 2578/2026 entries
}

export const HOLIDAYS_2026: Holiday[]; // 19 entries

export function isHoliday(date: string | Date): boolean;
export function getHolidayName(date: string | Date): string | null;
```

Includes all 19 Colombian fechas 2026 (fixed + Ley Emiliani Monday shifts). Ley 2578/2026 note for July 13 annotated in code comments.

## Classifier Engine (`src/lib/scheduleClassifier.ts`)

```typescript
export function scheduleClassifier(input: ScheduleClassifierInput): PayrollInput;
```

**Algorithm per WorkedDay** (repeated for each day in the fortnight):

1. Convert entry/exit to fractional hours, subtract lunch → `totalHours`
2. Compute expected ordinary hours from profile: `exitTime - entryTime - lunchBreak` 
   → `expectedDayHours` for any work day (ej. 08:00-18:00 + 60min lunch = 9h)
3. Split into day (06:00-18:59) vs night (19:00-05:59) blocks at 30-min resolution
4. Classification matrix:

| Day type | Hours within `expectedDayHours` | Hours beyond `expectedDayHours` |
|----------|-------------------------------|-------------------------------|
| Regular, day hours | base pay (not returned) | `dayOT` |
| Regular, night hours | `nightSurcharge` | `nightOT` |
| Holiday, day hours | `holidaySurcharge` | `holidayDayOT` |
| Holiday, night hours | `holidayNightSurcharge` | `holidayNightOT` |

5. Sum all days into the 7 output fields

**Edge cases:** Day off (entryTime = null) → 0 hours. Partial hours from 30-min rounding → truncated to 2 decimals per field. `expectedDayHours` derived per-day-of-week from the profile (not a generic 7h constant).

## Component Architecture

```
CalculatorPage
├── PayrollForm          ← modified: mode tabs at top
│   ├── [Manual mode]   ← existing 7 field grid (unchanged)
│   └── [Schedule mode]
│       ├── ScheduleProfileForm  ← new: weekly profile config
│       └── DayEntryForm         ← new: date picker + per-day overrides
├── ResultsCard         ← unchanged
└── HistorySection      ← unchanged
```

**State in CalculatorPage:**
- `inputMode: InputMode` — toggles which form renders
- `scheduleProfile: ScheduleProfile | null`
- `workedDays: WorkedDay[]`
- `classifiedInput: PayrollInput` — computed via `useMemo` from profile + days

**Mode toggle behavior:**
- Switch clears the unrelated form state (schedule → manual: clears profile/days; manual → schedule: clears 7 fields)
- Toggle label text explains mode purpose
- Saved record includes `mode: InputMode` field

## Data Flow

```
User sets profile (workdays, times) → scheduleProfile state
  └── DayEntryForm shows date picker, user adds days
    └── Each new day pre-fills entry/exit/lunch from profile (overrideable)
User adjusts day entries → workedDays state
  └── useMemo triggers scheduleClassifier(profile, days)
    └── holiday.ts isHoliday() called per day
      └── PayrollInput produced → calculateBreakdown() → render
User saves → SavedRecord stores { inputs, mode, scheduleProfile?, workedDays? }
```

## Storage Schema (updated `SavedRecord`)

```typescript
// New optional fields added to existing SavedRecord
interface SavedRecord {
  // ...existing fields...
  mode?: InputMode;                    // 'manual' | 'schedule'
  scheduleProfile?: ScheduleProfile;   // present when mode='schedule'
  workedDays?: WorkedDay[];            // present when mode='schedule'
}
```

Backward compatible: old records lack these fields → `mode` defaults to `'manual'` at display.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `isHoliday()` all 19 dates + non-holidays | Pure function, parameterized test per date |
| Unit | `getHolidayName()` returns correct name | Direct assertion |
| Unit | `scheduleClassifier()` regular day | Profile + 1 day → exact 7-field output |
| Unit | `scheduleClassifier()` holiday day | Holiday date → holiday surcharge fields populated |
| Unit | `scheduleClassifier()` partial hours | 30-min entry → 0.5h classification |
| Unit | `scheduleClassifier()` day-off | null entryTime → 0 for all fields |
| Unit | `scheduleClassifier()` mixed day/night shift | Spanning 19:00 boundary → split correctly |
| Unit | `scheduleClassifier()` overtime day | 9h day → 7 ordinary, 2 OT |
| Integration | CalculatorPage mode toggle | Manual→Schedule clears fields, Schedule→Manual clears profile |
| Integration | Save+load schedule record | Works in history, loads without crash |
| Integration | Adding a date fills default times from profile | Date picker → entry/exit pre-filled |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Old records work unchanged (they have `inputs: PayrollInput` directly). New records optionally carry `mode`, `scheduleProfile`, and `workedDays` fields. Rollback: revert CalculatorPage/PayrollForm, delete new components and lib files.


