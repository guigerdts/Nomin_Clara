# Proposal: Indemnización por despido sin justa causa

## Intent

Workers dismissed without just cause can't verify what the employer owes as indemnización. Adds a section inside `/liquidacion` (below prestaciones) so exit reviews live in one place. Sub-módulo 2 of `modulo-liquidacion-laboral`; same educational spirit: real formulas + legal citations.

## Scope

### In Scope
- Gate: Despido sin justa causa | Renuncia | Mutuo acuerdo | Despido con justa causa comprobada. Only (a) calculates; (b)–(d) warning — no such right (Art. 64 CST)
- Término fijo (1): salary × months remaining; planned end date input; Art. 46 CST notice (<1 año: máx 3 prórrogas cortas, 4ª ≥ 1 año); optional renewals input → "verify with HR"
- Término indefinido (2): <10 SMMLV: 30 días + 20/año proportional; ≥10 SMMLV: 20 + 15
- Obra o labor (3): salary × time to finish, floor 15 días
- Pure module + section UI + tests

### Out of Scope
- Variable-income base (Corte Suprema last-year-average) — known limitation
- Suspensión (Art. 51/53), justa-causa adjudication, other modules

## Business Rules

| Rule | Ref |
|------|-----|
| Indemnización only for despido sin justa causa | Art. 64 CST |
| Fijo: salarios por tiempo restante | Art. 64 CST |
| Obra: hasta fin de obra, min 15 días (Art. 47 defines form only) | Art. 64 CST |
| Indefinido: 30+20×años / 20+15×años | Art. 64 CST |
| Fijo <1 año: máx 3 prórrogas cortas; 4ª ≥ 1 año | Art. 46 CST |
| Base = salario SIN auxilio (no es salario; cesantías/prima lo incluyen solo por orden expresa) | Ley 1ª/1963 Art. 7 |

## Capabilities

### New Capabilities
- `indemnizacion-despido`: gate + 3 contract-type formulas + Art. 46 CST notices

### Modified Capabilities
- None

## User Flow

Gate → contract type → inputs (salary, dates, type-specific) → Calcular → ConceptLine results + total.

## Inputs / Outputs

| Type | Inputs | Output |
|------|--------|--------|
| Fijo | salary, start, planned end, optional renewals | salary × months remaining |
| Indefinido | salary, start, dismissal date | scale × (years + fraction) |
| Obra | salary, start, planned end | remaining salary, floor 15 días |

## Edge Cases (for specs later)

- Exactly 1 year → 30 días, no fraction; fractional years × (months÷12)
- Contract expired before dismissal → 0; obra <15 días remaining → floor
- Exactly 10 SMMLV → high branch (20+15), pinned
- Coexistence with prestaciones section on same page

## Approach & Consistency

Pure `src/lib/indemnizacion.ts` (TDD-first), section below prestaciones. Reuse `countCommercialDays` (360-day/30-day months, e.g. 18 months → 30 + 20×(6/12)), `SMMLV`, `formatCOPExact` (centavos), ConceptLine pattern (concepto+formula+legalRef).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/indemnizacion.ts` | New | Pure calc module |
| `src/lib/__tests__/indemnizacion.test.ts` | New | Per-type + boundary tests |
| `src/pages/LiquidacionPage/LiquidacionPage.tsx` | Modified | Section below prestaciones |
| `LiquidacionPage.module.css` | Modified | Section styles |
| `LiquidacionPage.test.tsx` | Modified | Gate + flow tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Indefinido scale misread vs. CSJ variable-income doctrine | Med | Non-goal recorded; literal Art. 64 |
| Fijo prórroga education overreach | Low | Advisory only; HR-verify message |

Open questions: none blocking — 4 decisions approved; notice copy resolved at spec/design.

## Rollback Plan

Remove section, module, tests; revert page. No storage impact.

## Dependencies

- `liquidacion.ts` (`countCommercialDays`), `rates.ts` (`SMMLV`) — no changes

## Success Criteria

- [ ] `npx vitest run` green; exhaustive per-type tests
- [ ] Gate: (b)(c)(d) never calculate; warning shown
- [ ] 10 SMMLV boundary, expired-contract 0, obra floor pinned
- [ ] Formulas render with legal citations
