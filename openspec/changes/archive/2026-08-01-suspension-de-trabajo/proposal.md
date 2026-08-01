# Proposal: Suspensión del contrato de trabajo (CST Arts. 51 y 53)

## Intent

Módulo 3 of the `/liquidacion` umbrella. Suspension's effect on prestaciones is asymmetric per concept, so automating exact pesos is unsafe without a lawyer. The worker's real need is to KNOW what to verify with HR — not to get a final number. This module is **educational + tracking, not a peso calculator**.

## Scope

### In Scope
- Educational section (GlosarioRecargos know-your-rights pattern): Art. 51 causales in plain language; Art. 53 asymmetric-effect table; exception (incapacidad no profesional ≤ 180 días, licencia maternidad/paternidad)
- Registry: log suspension periods (fecha inicio, fecha fin, causal from 10-option selector); per-record checklist summary; full CRUD; localStorage
- Third section under `/liquidacion`, own component `SuspensionSection.tsx` + `SuspensionSection.module.css` (IndemnizacionSection pattern)

### Out of Scope
- Peso calculation / integration with `liquidacion.ts` (future iteration)
- Colective suspension by huelga legality/illegality rules (deeper legal topic)

## Fixed Product Decisions (owner-approved — do not revisit)

- **D1** — Causal selector: full 10 options — 8 causales Art. 51 CST (fuerza mayor o caso fortuito; muerte o inhabilitación del empleador — personas naturales; suspensión de actividades de la empresa hasta 120 días; licencia o permiso temporal acordado; suspensión disciplinaria; detención preventiva del trabajador hasta 8 días; arresto correccional hasta 8 días; huelga declarada) + 2 special cases (incapacidad médica; licencia maternidad/paternidad)
- **D2** — Art. 112 excess warning: for suspensión disciplinaria, conditional field "¿Es tu primera suspensión disciplinaria, o ya tuviste otra antes?"; threshold 8 días (primera vez) vs 2 meses = 60 días (reincidencia). NEVER a single generic threshold (false positives on legitimate reincidencias)
- **D3** — Full CRUD (add/edit/delete), same pattern as the rest of the app

## User Stories

- As a worker, I want each causal explained in simple language with its citation so I can recognize which applies to me.
- As a worker, I want the Art. 53 table so I know what may (cesantías, vacaciones) and may not (prima, intereses) be deducted.
- As a worker, I want to log each period and get a per-record checklist of what to verify with my employer.
- As a worker with incapacidad/licencia, I want explicit "no deduction from any prestación" (distinct case).

## Assumptions

- Registry is tracking-only; no peso math; no `liquidacion.ts` integration this iteration
- Dates stored as ISO `YYYY-MM-DD`; duration in calendar days
- Reincidencia threshold = 60 días (2 meses), per D2
- CSJ fundamento for the prima/intereses rule: exact wording pinned during specs from the product brief (links limited to verified `OFFICIAL_LINKS`)
- Educational/UI copy in Spanish, neutral/professional register; legal citations verbatim Spanish

## Capabilities

### New Capabilities
- `suspension-de-trabajo`: causales Art. 51 + asymmetric-effect rules Art. 53 (incl. CSJ fundamento) + registry CRUD with conditional warnings

### Modified Capabilities
- None (no spec-level change to `liquidacion-basica` or `indemnizacion-despido`)

## Approach

Pure `src/lib/suspension.ts` (TDD-first): CAUSALES metadata (10 items: label, legalRef, `special` flag), `getDisciplinaryThreshold(firstTime)` → 8 | 60, `buildChecklist(causal)` → standard vs special text, calendar-day validation. Section renders educational content + registry; persistence via useDraftQuincena pattern (try/catch JSON, localStorage key `nomina-clara-suspensiones`). Links reused verbatim from `OFFICIAL_LINKS` (GlosarioRecargos.tsx) — SUIN Juriscol + Función Pública; **no new URLs**. UI copy Spanish, neutral/professional register; legal citations verbatim Spanish (CSJ fundamento wording pinned in specs).

Checklist standard text (UI copy): "Este período NO debería afectar tu prima ni tus intereses sobre cesantías. SÍ puede descontarse de tus vacaciones y cesantías acumuladas — verifica que tu empresa lo esté aplicando así, no al revés."

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/LiquidacionPage/SuspensionSection.tsx` | New | Educational + registry section |
| `src/pages/LiquidacionPage/SuspensionSection.module.css` | New | Section styling (IndemnizacionSection pattern) |
| `src/pages/LiquidacionPage/LiquidacionPage.tsx` | Modified | Import + render below IndemnizacionSection |
| `src/lib/suspension.ts` | New | Pure logic: causales, thresholds, checklist builder |
| `src/lib/types.ts` | Modified | `SuspensionCausal` union + `SuspensionRecord` |
| `src/lib/__tests__/suspension.test.ts` | New | Unit tests |
| `src/pages/LiquidacionPage/LiquidacionPage.test.tsx` | Modified | Section render + CRUD flow tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legal accuracy (Art. 53 asymmetry, CSJ fundamento) | Med | Pin fundamento wording in specs; cite only verified links; educational disclaimer |
| Generic 8-day warning → false positives on reincidencia | Med | D2: conditional threshold 8 vs 60 días |
| Scope creep into peso calculation | Med | Non-goal recorded; no `liquidacion.ts` integration |
| localStorage schema drift | Low | Versioned key, try/catch parse (useDraftQuincena pattern) |
| PR size (400-line budget) | Low | Own files; small lib module; guard evaluated at tasks |

## Rollback Plan

Revert `LiquidacionPage.tsx`; delete `SuspensionSection.*`, `src/lib/suspension.ts`, types additions. Leftover localStorage key is inert (no reader) — clearable. No migration.

## Dependencies

- None external. Links reused from GlosarioRecargos `OFFICIAL_LINKS` (SUIN Juriscol CST + Ley 2466/2025, Función Pública).

## Success Criteria

- [ ] `npx vitest run` green + `npx tsc --noEmit` passes
- [ ] All 10 causales selectable; disciplinaria asks primera vez/reincidencia; warning threshold 8 or 60 días accordingly
- [ ] Checklist differs for incapacidad/licencia (no deduction from any prestación) vs standard text
- [ ] Art. 53 asymmetric table + exception rendered with citations
- [ ] CRUD persists across reloads (localStorage `nomina-clara-suspensiones`)
- [ ] No integration with `liquidacion.ts` — peso calc stays out
