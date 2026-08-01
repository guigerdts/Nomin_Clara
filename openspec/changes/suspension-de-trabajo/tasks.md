# Tasks: Suspensión del Contrato de Trabajo (CST Arts. 51 y 53)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 900–1100 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 logic (~350) → PR 2 section (~400) → PR 3 tests+wiring (~280) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — suggested stacked-to-main (repo precedent); user decides at apply |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

Out of scope: `liquidacion.ts` integration (no pesos); `LiquidacionPage.module.css`; new URLs (reuse OFFICIAL_LINKS hrefs verbatim).

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Types + `suspension.ts` + unit tests (18 scenarios) | PR 1 (~350) | `npx vitest run src/lib/__tests__/suspension.test.ts` | N/A — pure logic; unit tests are the proof | Delete module+test; revert `types.ts` |
| 2 | `SuspensionSection.tsx` + `.module.css` | PR 2 (~400) | `npx tsc --noEmit` | `npx vite dev` → `/liquidacion`: third section renders Art. 51/53 | Delete section + css |
| 3 | Component tests + page wiring + integration | PR 3 (~280) | `npx vitest run src/pages/LiquidacionPage/__tests__/` | `npx vite dev` → CRUD + D11 blocked submit | Revert `LiquidacionPage.tsx` + page test; delete component tests |

## Phase 0: Apply protocol (do FIRST)

- [x] 0.1 Create `apply-progress.md` (change folder) with RED→GREEN table; update after EVERY task DURING apply — never regenerate at the end
- [x] 0.2 Every `npx vitest run` tees full output to `/tmp/opencode/vitest-<phase>.log`

## Phase 1: Foundation + pure logic (RED→GREEN)

- [x] 1.1 Add to `src/lib/types.ts`: `SuspensionCausal` (10 kebab-case), `SuspensionRecord` (id, startDate, endDate, causal, `isFirstDisciplinary?: boolean` — optional per D11), `SuspensionStore` { version: 1; records }
- [x] 1.2 RED `src/lib/__tests__/suspension.test.ts`: all 18 scenarios — thresholds 8/9 and 60/61; duration inclusive (`T12:00:00`, invalid → 0); `isValidPeriod` rejects end < start; non-disciplinary never warns; exactly 8/60 never warn; `?? true` fallback (REQ-5/6)
- [x] 1.3 RED: `buildChecklist` standard vs special text ("no se descuenta de NINGUNA prestación") (REQ-5)
- [x] 1.4 GREEN `src/lib/suspension.ts`: `CAUSALES` (10, Spanish labels, `legalRef 'CST Art. 51'`, `special` flag), `getDisciplinaryThreshold`, `getDurationDays`, `isValidPeriod`, `shouldShowExcessWarning`, `buildChecklist`; no clock (D8)

## Phase 2: Section UI

- [x] 2.1 Create `SuspensionSection.tsx`: Art. 51 causales list, Art. 53 asymmetric table + CSJ fundamento + exception callout; OFFICIAL_LINKS hrefs verbatim (REQ-1/2)
- [x] 2.2 Create `SuspensionSection.module.css` (IndemnizacionSection pattern)
- [x] 2.3 Registry: 10-causal selector, dates, full CRUD, persistence key `nomina-clara-suspensiones` (REQ-3/4)
- [x] 2.4 D11: disciplinaria → `isFirstDisciplinary` REQUIRED (submit blocked), hidden for other 9; per-record checklist + excess warning 8/60 (REQ-5/6)

## Phase 3: Component tests + integration

- [x] 3.1 RED `__tests__/SuspensionSection.test.tsx`: 10 options; CRUD + persistence; D11 blocked submit; field hidden for 9 causales; warnings 8/9/60/61; checklist variants; Art. 53 table
- [x] 3.2 Modify `LiquidacionPage.tsx`: render `<SuspensionSection />` below `<IndemnizacionSection />`
- [x] 3.3 RED `__tests__/LiquidacionPage.test.tsx`: third section renders; prestaciones + indemnización unchanged; no label collisions
- [x] 3.4 Full `npx vitest run` (tee log) + `npx tsc --noEmit && npx vite build`

## Phase 4: Docs + commits

- [ ] 4.1 Mark tasks `[x]` and finalize apply-progress.md RED→GREEN (per 0.1, during apply)
- [ ] 4.2 Commit canonical spec `openspec/specs/suspension-de-trabajo/spec.md` as normal docs commit — never in review scope
- [ ] 4.3 Commits per work-unit-commits: `feat(suspension): add pure suspension logic and tests` → `feat(suspension): add SuspensionSection UI and CRUD` → `feat(suspension): add component tests and page wiring`; no Co-Authored-By
