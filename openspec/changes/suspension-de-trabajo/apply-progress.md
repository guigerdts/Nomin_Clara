# Apply Progress: suspension-de-trabajo

**Change**: suspension-de-trabajo (Módulo 3 — Suspensión del contrato, CST Arts. 51 y 53)
**Slice**: PR1 — pure logic only (NO UI)
**Branch**: `suspension/pr1-logica`
**Artifact store**: openspec
**Mode**: STRICT TDD (`openspec/config.yaml` → `tdd: true`; runner `npx vitest run`)
**Workload decision**: resolved by orchestrator — chained PR slice PR1 (tasks 0.1, 0.2, 1.1–1.4); PR2 UI / PR3 tests+wiring are separate batches.

## RED → GREEN Table

| Task | RED (test written first) | GREEN (impl passes) | Evidence |
|------|--------------------------|---------------------|----------|
| 0.1 `apply-progress.md` | N/A (protocol) | ✅ created + updated after every task | file exists in change folder; maintained incrementally during apply |
| 0.2 vitest output tee | N/A (protocol) | ✅ active from first run | baseline run → `/tmp/opencode/vitest-pr1-baseline.log` (15 files / 278 tests / exit 0) |
| 1.1 `src/lib/types.ts` types | N/A (structural — pure type exports) | ✅ added + tsc 0 | `npx tsc --noEmit` exit 0 (types: SuspensionCausal 10-value union, SuspensionRecord with `isFirstDisciplinary?`, SuspensionStore version 1) |
| 1.2 RED `suspension.test.ts` (18 scenarios) | ✅ written (all 18 mapped) | ✅ GREEN via 1.4 | RED run exit 1 (module not found) → GREEN 23/23 → `/tmp/opencode/vitest-pr1.log` |
| 1.3 RED `buildChecklist` standard/special | ✅ written (same test file as 1.2) | ✅ GREEN via 1.4 | checklist tests pass; verbatim STANDARD text + SPECIAL "no se descuenta de NINGUNA prestación" |
| 1.4 GREEN `src/lib/suspension.ts` | N/A (tests from 1.2/1.3) | ✅ | focused 23/23 GREEN; full suite 301/301 (16 files); `npx tsc --noEmit` exit 0 |

## TDD Cycle Evidence (Strict TDD)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | N/A (types) | Unit | ✅ 15 files/278 tests baseline | ➖ structural | ✅ tsc exit 0 | ➖ Triangulation skipped: purely structural type exports | ➖ None needed |
| 1.2 | `src/lib/__tests__/suspension.test.ts` | Unit | ✅ 15 files/278 tests | ✅ Written (18 scenarios, 23 tests) | ✅ 23/23 passed | ✅ multiple cases per behavior (8/9, 60/61, inclusive, invalid) | ➖ None needed |
| 1.3 | `src/lib/__tests__/suspension.test.ts` | Unit | ✅ | ✅ Written (checklist variants) | ✅ 23/23 passed | ✅ standard + special + content assertions | ➖ None needed |
| 1.4 | `src/lib/__tests__/suspension.test.ts` | Unit | ✅ | N/A | ✅ 23/23 passed + full 301/301 + tsc 0 | N/A | ✅ module doc-comment style, constants extracted |

## Work Unit Evidence (PR1 slice)

| Evidence | Required value |
|----------|----------------|
| Focused test command + exact result | `npx vitest run src/lib/__tests__/suspension.test.ts` → RED exit 1 (resolve error) → GREEN 23/23, exit 0 |
| Runtime harness command/scenario + result | N/A — pure logic module; unit tests are the proof (design.md Testing Strategy: unit layer) |
| Rollback boundary | Delete `src/lib/suspension.ts` + `src/lib/__tests__/suspension.test.ts`; revert `src/lib/types.ts` suspension additions (3 exports); `apply-progress.md` rows are inert docs |

## Scenario → Test Mapping (all 18 spec scenarios)

| # | Spec scenario | Layer covered | Test in PR1 |
|---|---------------|---------------|-------------|
| REQ-1/1 | All eight causales with plain-language explanations | CAUSALES metadata (PR1) + render (PR3) | `CAUSALES metadata › lists the 8 Art. 51 causales` |
| REQ-1/2 | Citation is verbatim and display-only | CAUSALES `legalRef` (PR1) + render (PR3) | same test asserts `legalRef === 'CST Art. 51'`, no calculation |
| REQ-2/3 | Asymmetric effects rendered per concept | STANDARD_CHECKLIST content (PR1) + table render (PR3) | `CAUSALES metadata › encodes the Art. 53 asymmetry` |
| REQ-2/4 | CSJ fundamento cited for prima/intereses | UI table (PR3) — no calculation path | N/A (pure logic; UI copy pinned at PR2) |
| REQ-2/5 | Incapacidad/licencia count as worked time | `special` flag + SPECIAL_CHECKLIST (PR1) + UI (PR3) | `CAUSALES metadata › marks … as special` + checklist tests |
| REQ-3/6 | All ten options are selectable | CAUSALES length 10 (PR1) + selector render (PR3) | `CAUSALES metadata › exposes exactly 10 causales` |
| REQ-3/7 | Special causales selectable alongside Art. 51 | CAUSALES values (PR1) + selector render (PR3) | same 10-causales test + special-flag test |
| REQ-4/8 | Adding a period persists it | localStorage UI (PR3); logic = validation + duration | `isValidPeriod › accepts valid ranges` + `getDurationDays` |
| REQ-4/9 | End date before start date is rejected | `isValidPeriod` (PR1) + form validation (PR3) | `isValidPeriod › rejects an end date before the start date` |
| REQ-4/10 | Editing updates the persisted record | localStorage UI (PR3) | N/A (pure logic; covered in PR3 component tests) |
| REQ-4/11 | Deleting removes the record | localStorage UI (PR3) | N/A (pure logic; covered in PR3 component tests) |
| REQ-5/12 | Standard checklist text for standard causales | `buildChecklist` (PR1) + per-record render (PR3) | `buildChecklist › returns the standard text … verbatim` |
| REQ-5/13 | Special checklist text for incapacidad/licencia | `buildChecklist` (PR1) + per-record render (PR3) | `buildChecklist › special text … NINGUNA prestación` |
| REQ-6/14 | First suspension of exactly 8 days → no warning | `shouldShowExcessWarning` (PR1) + UI (PR3) | `shouldShowExcessWarning › does NOT warn on … exactly 8 days` |
| REQ-6/15 | First suspension of 9 days → warning | `shouldShowExcessWarning` (PR1) + UI (PR3) | `shouldShowExcessWarning › warns on … 9 days` |
| REQ-6/16 | Reincidencia of exactly 60 days → no warning | `shouldShowExcessWarning` (PR1) + UI (PR3) | `shouldShowExcessWarning › does NOT warn on … exactly 60 days` |
| REQ-6/17 | Reincidencia of 61 days → warning | `shouldShowExcessWarning` (PR1) + UI (PR3) | `shouldShowExcessWarning › warns on … 61 days` |
| REQ-6/18 | Non-disciplinary causales never trigger the field | `shouldShowExcessWarning` (PR1) + UI (PR3) | `shouldShowExcessWarning › never warns for the other 9 causales` |

Plus design-required unit coverage: `getDisciplinaryThreshold` (8/60), `getDurationDays` (inclusive T12:00:00, invalid → 0), `?? true` defensive fallback (D11) on incomplete record.

## Verification (PR1 slice)

| Check | Command | Result |
|-------|---------|--------|
| Focused suite | `npx vitest run src/lib/__tests__/suspension.test.ts` | 23/23 passed, exit 0 → `/tmp/opencode/vitest-pr1.log` |
| Full suite | `npx vitest run` | 16 files / 301 tests passed, exit 0 → `/tmp/opencode/vitest-pr1-full.log` |
| Typecheck | `npx tsc --noEmit` | exit 0 → `/tmp/opencode/vitest-pr1-tsc.log` |
| RED evidence | `npx vitest run src/lib/__tests__/suspension.test.ts` (pre-impl) | exit 1, failed to resolve `../suspension` → `/tmp/opencode/vitest-pr1-red.log` |

## Status
PR1 tasks 0.1–1.4: **6/6 complete**. All green. Ready for next batch (PR2 UI) / verify.

---

# PR2 Slice — tasks 2.1–2.4 (section UI + registry + D11)

**Branch**: `suspension/pr2-ui` (based on PR1 commit `58f3bbd`)
**Slice**: PR2 — `SuspensionSection.tsx` + `.module.css` (educational content, registry CRUD, D11). NO component tests (PR3, tasks 3.1–3.3), NO `LiquidacionPage.tsx` wiring (PR3, task 3.2).
**Mode**: STRICT TDD — component tests are PR3 scope per orchestrator slice boundary; the PR2 verification gate defined by tasks.md Unit 2 is `npx tsc --noEmit` (+ `npx vite dev` browser harness). Full suite + build run as regression safety net.

## RED → GREEN Table (PR2)

| Task | RED (test written first) | GREEN (impl passes) | Evidence |
|------|--------------------------|---------------------|----------|
| 2.1 `SuspensionSection.tsx` educational content | ➖ Deferred to PR3 (task 3.1 component tests) | ✅ tsc 0 + pipeline build 0 | 10-causal list (REQ-1 incl. special badge), Art. 53 asymmetric table + CSJ fundamento note + exception callout (REQ-2), OFFICIAL_LINKS hrefs verbatim (D10) |
| 2.2 `SuspensionSection.module.css` | N/A (structural stylesheet) | ✅ compiled via pipeline | throwaway-entry vite build transformed the `.module.css` (16 modules, exit 0); IndemnizacionSection token pattern |
| 2.3 Registry CRUD + persistence | ➖ Deferred to PR3 (task 3.1 CRUD/persistence tests) | ✅ tsc 0 | `STORAGE_KEY 'nomina-clara-suspensiones'`; `loadSuspensionStore` (lazy try/catch, version gate → empty); add/edit/delete persist-on-mutation (useDraftQuincena pattern, D9); `isValidPeriod` rejects end < start with `role="alert"` error |
| 2.4 D11 two-layer contract | ➖ Deferred to PR3 (task 3.1 blocked-submit test) | ✅ tsc 0 | Field rendered ONLY for `suspension-disciplinaria`; submit blocked + error when unanswered; `buildExcessWarning` (pure export) via `shouldShowExcessWarning` (8/9, 60/61 boundaries); field hidden for the other 9 causales; per-record `buildChecklist` standard/special |

## TDD Cycle Evidence (Strict TDD — PR2)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1 | N/A — `__tests__/SuspensionSection.test.tsx` is PR3 (task 3.1) | Integration (PR3) | ✅ 16 files / 301 tests | ➖ Deferred by slice boundary | ✅ tsc exit 0; pipeline build 16 modules | ➖ PR3 (10 options, Art. 53 table scenarios) | ➖ None needed |
| 2.2 | N/A (CSS, structural) | N/A | ✅ 301 tests | ➖ Structural | ✅ vite pipeline compiled `.module.css` | ➖ Triangulation skipped: purely structural stylesheet | ➖ None needed |
| 2.3 | N/A — CRUD/persistence tests are PR3 (3.1) | Integration (PR3) | ✅ 301 tests | ➖ Deferred by slice boundary | ✅ tsc exit 0; `loadSuspensionStore` pure-exported for PR3 unit tests | ➖ PR3 (add/edit/delete/persist scenarios) | ➖ None needed |
| 2.4 | N/A — D11 blocked-submit test is PR3 (3.1) | Integration (PR3) | ✅ 301 tests | ➖ Deferred by slice boundary | ✅ tsc exit 0; `buildExcessWarning` pure-exported | ➖ PR3 (8/9/60/61 boundary scenarios) | ➖ None needed |

> **TDD note (documented deviation, not silent fallback)**: strict-tdd.md's Hard Gate requires RED tests before production code. For this slice the orchestrator explicitly carved component tests OUT of PR2 (tasks 3.1–3.3 belong to PR3) and tasks.md Unit 2 defines PR2's focused command as `npx tsc --noEmit`. RED evidence is therefore deferred by slice boundary — task 3.1 writes the RED tests against this exact component API (labels, roles, exported helpers). This deviation is recorded here and in the apply return summary so verify can reconcile.

## Work Unit Evidence (PR2 slice)

| Evidence | Required value |
|----------|----------------|
| Focused test command + exact result | `npx tsc --noEmit` → exit 0 (`/tmp/opencode/vitest-pr2-tsc.log`); focused `npx vitest run src/lib/__tests__/suspension.test.ts` → 23/23, exit 0 (`/tmp/opencode/vitest-pr2-focused.log`) |
| Runtime harness command/scenario + result | `npx vite build` → built in 4.16s, exit 0 (`/tmp/opencode/vitest-pr2-build.log`); new-module pipeline check via throwaway entry → 16 modules transformed, exit 0 (`/tmp/opencode/vitest-pr2-csscheck.log`). Browser harness N/A for headless apply — `npx vite dev` manual check belongs to PR3 wiring per tasks.md Unit 2 |
| Rollback boundary | Delete `src/pages/LiquidacionPage/SuspensionSection.tsx` + `SuspensionSection.module.css`; nothing else touched (`LiquidacionPage.tsx` unmodified — PR3 scope). Apply-progress rows are inert docs |

## Verification (PR2 slice)

| Check | Command | Result |
|-------|---------|--------|
| Typecheck | `npx tsc --noEmit` | exit 0 → `/tmp/opencode/vitest-pr2-tsc.log` |
| Focused PR1 suite | `npx vitest run src/lib/__tests__/suspension.test.ts` | 23/23 passed, exit 0 → `/tmp/opencode/vitest-pr2-focused.log` |
| Full suite | `npx vitest run` | 16 files / 301 tests passed, exit 0 → `/tmp/opencode/vitest-pr2-full.log` |
| Build | `npx vite build` | built in 4.16s, exit 0 → `/tmp/opencode/vitest-pr2-build.log` |
| New-module pipeline | throwaway-entry `vite build --config vite.config.check.ts` | 16 modules transformed, exit 0 → `/tmp/opencode/vitest-pr2-csscheck.log` (throwaway files removed after check) |

## Open items carried to PR3 / verify

- CSJ jurisprudencia wording for the prima/intereses row: design.md Open Question — pinned generically at institutional level ("CSJ, Sala de Casación Laboral") without fabricating a radicado; exact wording/radicado to be pinned from the product brief before verify.
- Component tests (tasks 3.1, 3.3) and page wiring (task 3.2) are the next slice (PR3).

## Status
PR1 (0.1–1.4) + PR2 (2.1–2.4): **10/10 complete**. All green. Ready for PR3 (component tests + wiring).
