# Tasks: Daily Draft Quincena

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Foundation: type + hook + fortnight utils | PR 1 | `npx vitest run src/hooks/__tests__/useDraftQuincena.test.ts` | N/A — pure hook tests with mocked localStorage | Revert types.ts + delete useDraftQuincena.ts |
| 2 | UI: Hoy section + CalculatorPage wiring | PR 1 | `npx vitest run --reporter=verbose -t "draft" src/pages/CalculatorPage/__tests__/CalculatorPage.test.tsx` | N/A — integration tests inside test suite | Revert PayrollForm.tsx + CalculatorPage.tsx |
| 3 | Tests: unit + integration coverage | PR 1 | `npx vitest run` | N/A — test suite covers it | No separate rollback |

## Phase 1: Foundation

- [x] 1.1 RED: Write failing tests for `getFortnightRange` pure function — day ≤ 15, day > 15, Feb non-leap/leap, 31-day month
- [x] 1.2 GREEN: Add `DraftQuincena` interface to `src/lib/types.ts`
- [x] 1.3 GREEN: Extract `getFortnightRange()` as pure exported function in `src/hooks/useDraftQuincena.ts`
- [x] 1.4 RED: Write failing tests for `useDraftQuincena`: addDay upsert, updateDay partial merge, removeDay, stale detection (old vs current), closeDraft builds SavedRecord + deletes key, discardDraft clears key
- [x] 1.5 GREEN: Implement `useDraftQuincena` hook — localStorage key `nomina-clara-draft-{startDate}`, all API members (draft, addDay, updateDay, removeDay, closeDraft, discardDraft, progress, staleDraftInfo)

## Phase 2: UI Integration

- [x] 2.1 RED: Write integration tests — draft survives refresh, stale dialog on mount, close fortnight end-to-end in `CalculatorPage.test.tsx`
- [x] 2.2 GREEN: Add `DraftSavePayload` interface + `onCloseFortnight` prop to `PayrollForm.tsx`
- [x] 2.3 GREEN: Add Hoy section JSX below mode toggle when `inputMode === 'schedule'`: today's date button, progress counter (registered/total), day list with inline edit/remove, "Close quincena & save" button
- [x] 2.4 GREEN: Add stale-draft confirmation dialog in `PayrollForm.tsx` — "Cerrar" → closeDraft + saveRecord, "Descartar" → discardDraft
- [x] 2.5 GREEN: Wire `CalculatorPage.tsx` — pass `onCloseFortnight` handler that builds `SavedRecord` from current inputs + draft workedDays → `saveRecord()` → refresh records → clear draft

## Phase 3: Verification

- [x] 3.1 Run full test suite: `npx vitest run` — all existing + new tests pass (219 tests)
