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

### Decision: Per-day schedule map (not single global schedule)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Single entry/exit/lunch para todos los días | Simple pero no refleja la realidad colombiana (sábado reducido, 42h semanales) | ❌ |
| `Record<DayOfWeek, DaySchedule>` con Partial | Cada día laboral tiene su propio horario; días que comparten horario usan la misma entrada; botón "usar mismo horario" evita repetir datos | ✅ |
| Migration: old format → all days get same schedule | Perfiles guardados con formato viejo se migran sin pérdida | ✅ |

### Decision: 30-min granularity fractional-hour output

All times input as HH:MM, internally converted to fractional hours (30-min blocks). Final category hours are truncated to 2 decimals to avoid IEEE 754 artifacts in the UI.

## Types (`src/lib/types.ts`)

```typescript
export type InputMode = 'manual' | 'schedule';
export type DayOfWeek = 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';

export interface DaySchedule {
  entryTime: string;          // "07:00"
  exitTime: string;           // "17:00"
  lunchBreakMinutes: number;  // 60
}

export interface ScheduleProfile {
  workDays: DayOfWeek[];
  schedules: Partial<Record<DayOfWeek, DaySchedule>>;
  // schedules[day] exists for every day in workDays
  // Migración desde formato legacy (entryTime/exitTime/lunchBreakMinutes):
  // todos los workDays reciben el mismo DaySchedule.
  // Legacy fields aún pueden existir en SavedRecord viejos.
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
2. Look up `DaySchedule` for this day-of-week from `profile.schedules[dow]`.
   Compute expected ordinary hours: `entryTime - exitTime - lunchBreakMinutes`
   → `expectedDayHours` (ej. Saturday: 07:00-14:00+0min = 7h; Mon-Fri: 07:00-17:00+60min = 9h)
   Si el día no está en workDays → expected = 0 (todas las horas son OT)
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

**ScheduleProfileForm UX (per-day schedules):**
- Días laborales: mismos checkboxes en fila (Lun-Sáb-Dom)
- Al marcar un día, se muestra su propio bloque de entrada/salida/almuerzo
- Botón "Usar mismo horario que..." para copiar el horario de otro día
- Si todos los días marcados comparten el mismo horario, el formulario colapsa a una vista simple (un solo bloque visible) para no abrumar
- Sábado se muestra con su propio horario editable

**DayEntryForm changes (pre-fill from per-day schedule):**
- Al agregar un día, `entryTime`/`exitTime`/`lunchBreakMinutes` se pre-llenan desde `profile.schedules[dayOfWeek(date)]`
- No desde un campo único del profile

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
| Unit | `scheduleClassifier()` **mixed per-day schedules** | Perfil con lunes-viernes 9h, sábado 6h. Worker trabaja 8h en sábado → 6h base + 2h OT (no 6.5h OT como daría un threshold único de 9h). Worker trabaja 10h en lunes → 9h base + 1h OT. |
| Integration | CalculatorPage mode toggle | Manual→Schedule clears fields, Schedule→Manual clears profile |
| Integration | Save+load schedule record | Works in history, loads without crash |
| Integration | Adding a date fills default times from profile | Date picker → entry/exit pre-filled |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

### ScheduleProfile format migration
Old-format `ScheduleProfile` records (with `entryTime`/`exitTime`/`lunchBreakMinutes` top-level fields) must be migrated on load:
- Leer `entryTime`, `exitTime`, `lunchBreakMinutes` del perfil
- Para cada `workDays[i]`, asignar `schedules[workDays[i]] = { entryTime, exitTime, lunchBreakMinutes }`
- Eliminar los campos legacy del objeto

La migración ocurre en el punto de carga (cuando se lee `SavedRecord` de localStorage), no en storage.ts — se transforma el objeto al cargarlo en CalculatorPage.

### General
Old records work unchanged (they have `inputs: PayrollInput` directly). Rollback: revert CalculatorPage/PayrollForm/ScheduleProfileForm/DayEntryForm, delete new lib changes.


