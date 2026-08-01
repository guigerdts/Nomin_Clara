# Proposal: Liquidación básica (prestaciones sociales)

## Intent

Workers ending a contract (renuncia, despido, mutuo acuerdo, vencimiento) can't verify what their employer owes in prestaciones sociales. Adds `/liquidacion` computing cesantías, intereses, prima, vacaciones with real formulas + legal citations — an argument to show RR.HH. Sub-módulo 1 of `modulo-liquidacion-laboral` umbrella; resolves `legal` spec non-goal "No severance or vacation calculations".

## Scope

### In Scope
- Pure `src/lib/liquidacion.ts` (TDD first): 4 formulas + inclusive date-diff + semester detection; exhaustive per-formula tests
- `/liquidacion` page (lazy, ComparePage pattern) + Header NavLink
- Result lines: concepto, fórmula con números reales, cita legal (GlosarioRecargos pattern)
- Fixed worked example card (non-editable)
- Amend `openspec/specs/legal/spec.md`

### Out of Scope
- Módulo 2 (indemnización Art. 64), Módulo 3 (suspensión Art. 51/53) — future proposals
- Mid-contract salary changes (single-salary boundary)

## Capabilities

### New Capabilities
- `liquidacion-basica`: cesantías (Art. 249 CST), intereses (Ley 52/1975), prima (Art. 306 CST), vacaciones (Art. 186 CST) with per-concept formula/legal-ref rendering + fixed worked example

### Modified Capabilities
- `legal`: remove non-goal "No severance or vacation calculations"

## Approach

Pure functions first (RED-GREEN via `npx vitest run`), then lazy page. Reuse `SMMLV`, `TRANSPORT_ALLOWANCE_2026`, `getTransportAllowance`, `formatCOP` from `rates.ts`. **Never** call `calculateBreakdown` (quincena allowance-halving). Confirmed decisions: (1) prima = days in semester containing end date only, auto-detected (ene-jun / jul-dic), with warning when a prior semester was already paid; (2) vacaciones net MAY be negative, neutral warning, no clamp; (3) auxilio auto-derived (≤ 2 SMMLV), "Aplica/No aplica" badge; (4) dedicated route. Day count: commercial 30-day months EVERYWHERE, no exception — semester split (180 + 30) must sum to total (210). Worked example: 01-ene-2026 → 31-jul-2026, base $2.000.000, 210 días, semester split shown.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/liquidacion.ts` | New | Pure module + date helpers |
| `src/lib/__tests__/liquidacion.test.ts` | New | Per-formula + edge cases |
| `src/App.tsx` | Modified | Lazy route `/liquidacion` |
| `src/components/Header.tsx` | Modified | NavLink "Liquidación" |
| `src/pages/LiquidacionPage/` | New | Form + results + example |
| `openspec/specs/legal/spec.md` | Modified | Non-goal removal |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prima day-count/semester ambiguity | Med | Tests pin inclusive convention; concrete example dates |
| Negative vacaciones misread as error | Med | Neutral warning, explicit no-clamp |
| Spec contradiction shipped | Med | Delta removes non-goal same change |

## Rollback Plan

Revert in reverse: remove route + NavLink, delete `LiquidacionPage/` and `liquidacion.ts` + tests, restore `legal/spec.md`. No storage/migration impact.

## Dependencies

- `rates.ts` (SMMLV 2026, auxilio 2026, `getTransportAllowance`, `formatCOP`) — no changes needed

## Success Criteria

- [ ] `npx vitest run` green: exhaustive per-formula tests (Art. 249, Ley 52/1975, Art. 306, Art. 186)
- [ ] Worked example: cesantías $1.166.666,67; intereses $81.666,67; vacaciones $510.680,63; prima per semester rule (jul-dic 2026, comercial 30 días, $166.666,67)
- [ ] Already-paid-semester warning shown; negative vacaciones allowed
- [ ] `legal` non-goal amended; auxilio matches PayrollForm badge (no `calculateBreakdown`)
