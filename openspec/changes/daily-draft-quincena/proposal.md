# Proposal: Daily Log with Auto-Save (DraftQuincena)

## Intent

Users currently enter all fortnight hours at once. This adds a daily "Hoy" section where they log "today I worked from X to Y" incrementally, auto-saving to localStorage. At fortnight's end, "Close & Save" converts the draft into a `SavedRecord` via the existing save flow. No changes to `scheduleClassifier()` or `calculateBreakdown()`.

## Scope

| What | File | Type |
|------|------|------|
| `DraftQuincena` type | `src/lib/types.ts` | **Modified** |
| `useDraftQuincena` hook | `src/hooks/useDraftQuincena.ts` | **Created** |
| "Hoy" section component | `src/pages/CalculatorPage/PayrollForm.tsx` | **Modified** |
| Close-fortnight wiring | `src/pages/CalculatorPage/CalculatorPage.tsx` | **Modified** |
| Draft persistence tests | `src/pages/CalculatorPage/__tests__/` | **Created** |

## Non-goals

- No changes to `scheduleClassifier()` or `calculateBreakdown()`
- No refactoring of `DayEntryForm` — draft is a standalone convenience layer
- No changes to `storage.ts` — draft manages its own key internally

## Capabilities

### New Capabilities
- `draft-quincena`: incremental daily hour logging with auto-persist to localStorage

### Modified Capabilities
- None

## User Story

1. User opens page in schedule mode → sees "Hoy" card below mode toggle
2. Clicks **"Agregar hoy"** → pre-fills today's date, opens entry/exit/lunch fields
3. Enters times → auto-saves to localStorage on each row add/update
4. Next day: returns → draft still there, clicks "Agregar hoy" again → adds another day
5. User returns after the fortnight ended → app detects stale draft → shows confirmation: "Tienes un registro sin cerrar del [rango de fechas] — ¿querés cerrarlo ahora o descartarlo?"
6. If "Cerrar": converts draft to SavedRecord. If "Descartar": deletes draft.
7. Day 15 (current): clicks **"Close quincena & save"** → draft removed, `SavedRecord` created with `workedDays` from draft, appears in history

## Business Rules

- **Fortnight detection**: day ≤ 15 → starts 1st, else starts 16th
- **Stale draft detection**: if draft's `startDate` ≠ current fortnight → show confirmation dialog: "Tienes un registro sin cerrar del [rango de fechas]. ¿Querés cerrarlo ahora o descartarlo?"
- **Stale draft resolution**: "Cerrar" → close flow (convert to SavedRecord); "Descartar" → delete draft key. No action is taken without explicit user decision.
- **Upsert**: add same date again → updates existing entry (no duplicates)
- **Close fortnight**: remove draft key from localStorage, build `SavedRecord` from calculator state + draft `workedDays`, call `saveRecord()`
- **Storage key**: `nomina-clara-draft-{quincenaStart}` (e.g. `nomina-clara-draft-2026-07-01`)
- **Save trigger**: persists on add/update/remove only (not on keystroke inside a field)

## Edge Cases

| Case | Behavior |
|------|----------|
| Stale draft from prior fortnight | Confirmation dialog on mount: "Cerrar ahora" or "Descartar" — never auto-cleared |
| Same-day re-entry | Upsert — updates existing row |
| Page refresh mid-quincena | Draft reloaded from localStorage on mount |
| Close without calculating | Show warning: "No hay cálculo. ¿Cerrar sin calcular?" |
| localStorage quota | Wrap `setItem` in try/catch (existing pattern) |
| No draft key exists | `useDraftQuincena` returns empty state |

## Approach

Standalone "Hoy" section inside `PayrollForm.tsx`, below mode toggle, above `DayEntryForm`. `useDraftQuincena` wraps the `useLocalStorage` pattern with fortnight detection and upsert logic. The draft is independent from the classifier — "Calculate" still reads from `DayEntryForm`. Close button constructs `SavedRecord` from calculator's current `inputs` + `breakdown` + draft `workedDays`, then calls `saveRecord()`.

## UX Flow

```
┌─ "Horario Detallado" mode ─────────────────────┐
│ [Manual │ Horario Detallado]  ← mode toggle     │
│                                                  │
│ ┌─ HOY ──────────────────────────────────────┐   │
 │ │  📅 Hoy, 20 julio 2026        [Agregar hoy] │   │
 │ │  Días registrados: 12/22                    │   │
 │ │  (días de la quincena actual)               │   │
│ │  ┌─ 20/07   08:00-17:00  60min [✏️][🗑️]  │   │
│ │  └─ ... (list of draft days)               │   │
│ │  ┌─────────────────────────────────────┐    │   │
│ │  │ [Close quincena & save]             │    │   │
│ │  └─────────────────────────────────────┘    │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ── DayEntryForm (full list) ─────────────────   │
│ ...                                               │
└──────────────────────────────────────────────────┘
```

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Close w/out calculated result | Low | Warning dialog before close |
| Two sources of worked days (draft vs DayEntryForm) | Med | Clear labeling: "Hoy" = draft, below = full list for Calculate |
| Draft lost on localStorage clear | Low | User action — expected behavior |

## Rollback Plan

Revert in reverse order: remove "Hoy" section from `PayrollForm.tsx`, delete `useDraftQuincena.ts`, restore `types.ts`, revert `CalculatorPage.tsx`. No migration needed — draft keys are ephemeral.

## Dependencies

- `useLocalStorage` pattern (existing hook) — blueprint for `useDraftQuincena`
- `WorkedDay` type — already exists in `types.ts`

## Success Criteria

- [ ] Draft survives page refresh within same fortnight
- [ ] Adding same date twice updates (no duplicate rows)
- [ ] Stale draft from prior fortnight shows confirmation dialog (never auto-clears)
- [ ] "Cerrar" in stale draft dialog converts to SavedRecord
- [ ] "Descartar" in stale draft dialog deletes draft key
- [ ] Progress counter shows correct total days for the actual fortnight period (not hardcoded 15)
- [ ] Close removes draft key from localStorage
- [ ] Closed fortnight appears in saved records history
- [ ] All existing tests still pass
