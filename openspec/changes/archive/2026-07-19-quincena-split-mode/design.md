# Design: Modo de distribución de deducciones por quincena

## Technical Approach

Add a `DeductionSplitMode` type (`'even' | 'second-fortnight' | 'first-fortnight'`) and thread it through the pure calculation layer (`deductions.ts`) and the UI layer (`DeduccionesForm`, `TotalsPanel`). The mode is persisted to `localStorage` and lives as separate component state in `CalculatorPage` — it's a company preference, not an attribute of the deduction amounts themselves.

## Architecture Decisions

### Decision: Where splitMode state lives

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inside `DeductionsInput` | Couples company preference to per-calculation inputs; pollutes API | ❌ Rejected |
| Separate state + localStorage | Clean separation, survives refresh, backwards-compatible | ✅ **Chosen** |

### Decision: Uniform mode vs. per-deduction mode

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Per-deduction split (e.g., health even, loan second) | More flexible but rare in practice; complex UI | ❌ Rejected |
| Uniform mode applies to ALL deductions | Matches Colombian practice; simpler code and UI | ✅ **Chosen** |

### Decision: calculateNetPay receives splitMode (not component)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Split logic in component | Mixes presentation with calculation logic | ❌ Rejected |
| Pure function in deductions.ts | Testable, follows existing pattern | ✅ **Chosen** |

### Decision: Items in TotalsPanel always show per-quincena amounts

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Items show monthly amounts, quincena total shows applied split | Data purity; user must mentally calculate current fortnight | ❌ Rejected |
| Items show per-quincena amounts based on mode | Duplicates split logic in presentation layer, but user sees EXACTLY what comes off THIS quincena | ✅ **Chosen** |

The `formatCOP(item.amount / 2)` today becomes `formatCOP(quincenaShare(item.amount, splitMode))` where:
- `'even'` → `amount / 2`
- `'second-fortnight'` → `amount`
- `'first-fortnight'` → `amount`

This means the entire deduction column is always "what you pay THIS fortnight", matching the user's mental model. The mode label appears as a subtitle above the deduction list so context is never lost.

## Data Flow

```
localStorage "deduction-split-mode" ──→ CalculatorPage (load on init, save on change)
                                              │
                                              │ passes splitMode to
                                              ▼
                              DeduccionesForm (radio group + help text)
                                              │
                                              │ onSplitModeChange →
                                              │ CalculatorPage updates state + localStorage
                                              │
                          splitMode ──────────┤
                                              │
                                              ▼
                              calculateNetPay(devengado, deductions, splitMode)
                              returns { netPay, quincenaDeductions, appliedMode }
                                              │
                                              ▼
                              TotalsPanel
                              items: monthlyAmount → quincenaShare(amount, splitMode)
                              total: quincenaDeductions
                              subtitle: "Modo: {mode label}"
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `vite/src/lib/types.ts` | Modify | Add `DeductionSplitMode` type and optional `splitMode` field to `DeductionsBreakdown` |
| `vite/src/lib/deductions.ts` | Modify | `calculateNetPay` accepts `splitMode` param; `computeDeductions` propagates it |
| `vite/src/pages/CalculatorPage/CalculatorPage.tsx` | Modify | Add `splitMode` state (from localStorage), pass to forms and calculation |
| `vite/src/pages/CalculatorPage/DeduccionesForm.tsx` | Modify | Add radio group for split mode with help text |
| `vite/src/pages/CalculatorPage/TotalsPanel.tsx` | Modify | Show mode indicator; items display quincena share per mode; quincena total reflects applied split |
| `vite/src/lib/__tests__/deductions.test.ts` | Modify | Add tests for all 3 modes + backwards compatibility |

## Interfaces / Contracts

```typescript
// types.ts addition
export type DeductionSplitMode = 'even' | 'second-fortnight' | 'first-fortnight';
```

```typescript
// deductions.ts — updated signature
export function calculateNetPay(
  devengado: number,
  deductions: DeductionsBreakdown,
  splitMode?: DeductionSplitMode,  // new, default 'even'
): {
  netPay: number;
  quincenaDeductions: number;
  appliedMode: DeductionSplitMode;
}
```

```typescript
// DeduccionesForm.tsx — new props
interface DeduccionesFormProps {
  salary: number;
  values: DeductionsInput;
  onChange: (values: DeductionsInput) => void;
  splitMode: DeductionSplitMode;          // new
  onSplitModeChange: (mode: DeductionSplitMode) => void;  // new
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `calculateNetPay` with all 3 modes | Pure function: `'even'` → `total/2`, `'second-fortnight'` → `total`, `'first-fortnight'` → `total` |
| Unit | `calculateNetPay` backwards compat | Omit `splitMode` → defaults to `'even'` |
| Unit | `calculateNetPay` with zero deductions | All modes return 0 |
| Unit | `quincenaShare(item.amount, splitMode)` helper | Each mode returns correct per-item quincena share |
| Storage | localStorage read/write | Default `'even'` when key missing; round-trip persistence |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Existing localStorage data does not contain `deduction-split-mode` — the default `'even'` ensures zero behavioral change for existing users. No feature flags needed.

## Open Questions

None.
