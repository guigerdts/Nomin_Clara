## Exploration: Liquidación básica (prestaciones sociales)

### Current State

**App architecture** — React 18.3 + TypeScript strict + Vite 5 + Vitest 2 (jsdom), react-router-dom v6, CSS Modules + global.css custom properties, no backend. Two routes in `src/App.tsx`: `/` (CalculatorPage, eager) and `/compare` (ComparePage, lazy + Suspense). Header nav in `src/components/Header.tsx` (NavLink "Calculadora" / "Comparar"). New pages follow: lazy import in App.tsx, NavLink in Header.tsx, page folder with CSS module.

**know-your-rights is LIVE but not a page** — it shipped as a second `<details>` block inside `GlosarioRecargos.tsx` (commits bcb6bad, 8976817), rendered always at the bottom of CalculatorPage. Change folder `openspec/changes/know-your-rights/` is still active (unarchived). Pattern precedent: content expansion inside an existing component, no routing.

**GlosarioRecargos visual pattern (hard requirement for result lines)** — `card` wrapper + `details/summary` accordion; table columns Concepto / Recargo / Valor × hora / Ref. legal; `.pct` (primary color), `.formula` (muted, 0.85em), `.cita` (muted legal ref); expandable `.detalleCard` with `.ejemploTexto` highlighted on `--color-primary-light`; voseo tone, SMMLV-grounded examples, `formatCOP`. Legal ref format: `CST Art. 179`, `CST Art. 168, 179`, `CST Art. 179, Ley 2466/2025`.

**Reusable legal logic** — `src/lib/rates.ts` exports `SMMLV`, `TRANSPORT_ALLOWANCE_2026`, `RATES`, `getOrdinaryHourValue`, `getTransportAllowance` (≤ 2 SMMLV → full monthly allowance, else 0), `formatCOP` (Math.round → es-CO), `formatPercent`, `validateOTLimits`, `calculateBreakdown`. Constants in `constants.ts` with legal-source comments: SMMLV 2026 = $1.750.905 (Decreto 1469/2025), auxilio 2026 = $249.095 (Decreto 1470/2025). `calculateBreakdown` halves the allowance for quincena; liquidación must use the FULL monthly value (quincena halving must NOT leak in).

**Transport allowance UX today** — NOT a user toggle: auto-derived in PayrollForm (`getTransportAllowance(salary)`), shown as badge "Aplica"/"No aplica" + `formatCOP` + hint "≤ 2 SMMLV". The requirement's "toggle (reuse existing logic)" conflicts slightly with the existing auto-derived badge — proposal must pick explicit checkbox vs. auto-derived readout.

**Tests** — pure logic: `src/lib/__tests__/rates.test.ts` pattern (describe/it/expect, `toBeCloseTo` for money, edge cases 0/negative). Component: RTL render/screen/fireEvent with `BrowserRouter` wrapper (CalculatorPage.test.tsx). config.yaml: `tdd: true`, `test_command: "npx vitest run"`.

**Dates** — ISO "YYYY-MM-DD" strings app-wide; `new Date(iso + 'T12:00:00')` local-date trick to avoid TZ issues (PayrollForm, DayEntryForm); `<input type="date">` used in DayEntryForm. NO existing inclusive-date-diff helper — the liquidación module needs its own (inclusive count between fecha ingreso/salida; convention must be pinned by tests).

**Fixed example math (verified)** — SMMLV 2026 $1.750.905 + auxilio $249.095 = base $2.000.000 (eligible ≤ 2 SMMLV). 210 días:
- Cesantías: 2.000.000 × 210/360 = $1.166.666,67
- Intereses: 1.166.666,67 × 12% × 210/360 = $81.666,67
- Prima: semestre computed from end date; ⚠️ 210 days span semesters for any end date — "días del semestre en curso" needs a concrete definition (see Risks)
- Vacaciones: 1.750.905 × 210/720 = $510.680,63 (menos días disfrutadas)
- Semestre day counts 2026: ene-jun = 181 días, jul-dic = 184 días (formula still ÷ 360, commercial year).

### Affected Areas

- `src/lib/liquidacion.ts` (NEW) — pure module: cesantías, intereses, prima, vacaciones + date helpers; exhaustive per-formula tests. Follows rates.ts commenting convention with article references.
- `src/lib/__tests__/liquidacion.test.ts` (NEW) — per-formula unit tests (CST Art. 249, Ley 52/1975, CST Art. 306, CST Art. 186), edge cases, semester detection, worked-example numbers.
- `src/App.tsx` — add lazy route `/liquidacion` (ComparePage pattern) if dedicated page is chosen.
- `src/components/Header.tsx` — add NavLink "Liquidación".
- `src/pages/LiquidacionPage/` (NEW) — form + results (GlosarioRecargos visual pattern) + fixed worked example card + CSS modules.
- `src/lib/constants.ts` — no change needed: SMMLV 2026 and auxilio 2026 already present with legal refs.
- `src/lib/rates.ts` — no change needed: `getTransportAllowance`, `formatCOP`, `SMMLV`, `TRANSPORT_ALLOWANCE_2026` are reused directly.
- `src/pages/CalculatorPage/CalculatorPage.tsx` — untouched (if dedicated page chosen).
- `openspec/specs/legal/spec.md` — Non-Goals currently states "No severance or vacation calculations" — MUST be updated (MODIFIED/REMOVED requirement) when this capability lands.

### Approaches

1. **Dedicated page + route `/liquidacion`** — new `LiquidacionPage` (lazy, like ComparePage), pure `lib/liquidacion.ts` first (TDD), results UI reusing the GlosarioRecargos visual pattern, fixed example card.
   - Pros: scales for sub-módulos 2 y 3 del umbrella; clean domain separation; zero risk to the quincena calculator; matches app routing conventions.
   - Cons: more files, route + nav wiring.
   - Effort: Medium

2. **Section inside CalculatorPage** (know-your-rights precedent) — pure lib + tests, render a LiquidacionCard below/above GlosarioRecargos.
   - Pros: minimal wiring, no routing.
   - Cons: conflates quincena and liquidación domains; a 3-submodule umbrella would bloat the page; weaker fit for the full UI requirement (inputs + results + example).
   - Effort: Low–Medium

3. **Lib-only now, UI later** — ship `liquidacion.ts` + tests; defer all UI.
   - Pros: smallest first PR.
   - Cons: fails the stated feature (UI inputs, result lines, worked example are explicit requirements).
   - Effort: Low

### Recommendation

**Approach 1 — dedicated page/route.** The requirement explicitly includes UI inputs, per-concept result lines, and a fixed worked example: that is a page. The capability umbrella ("modulo-liquidacion-laboral", 3 sub-módulos) makes a dedicated route the scalable choice — sub-módulos 2 y 3 can extend the same page/domain. Order per config.yaml: legal/calc module first with exhaustive tests, then UI, then example. Reuse `getTransportAllowance`/`formatCOP`/constants directly; do NOT halve the allowance (that quincena logic is inside `calculateBreakdown`, which liquidación must not call).

### Risks

- **Prima "días del semestre en curso" ambiguity** — the semestre is derived from the end date, but the day count must be precisely defined (overlap between worked period and the semester containing end date). The fixed example (210 days) spans semesters for ANY end date, so it needs concrete start/end dates or a stated assumption; otherwise the example numbers are wrong. MUST be pinned in spec + tests.
- **Vacaciones "días ya disfrutadas" semantics** — net = gross − enjoyed; decide clamping at 0 and whether enjoyed > accrued warns or errors.
- **Day-count convention** — inclusive vs exclusive between fecha ingreso/salida (e.g. 1 ene–31 jul = 210 vs 211 días) must be pinned by a test; use the app's `T12:00:00` local-date trick.
- **Display precision in formula lines** — requirement shows "fórmula con los números reales": decide whether formulas show 2-decimal values (e.g. $1.166.666,67) while totals use rounding `formatCOP`.
- **"Toggle" vs auto-derivation** — requirement says auxilio toggle, app currently auto-derives via badge; proposal must pick (explicit checkbox vs. reuse auto-derived readout) and note the consistency implication.
- **Legal spec contradiction** — `openspec/specs/legal/spec.md` Non-Goals says "No severance or vacation calculations"; the delta spec must MODIFY/REMOVE that line.
- **Single-salary assumption** — no mid-contract salary changes modeled; stated as a scope boundary.

### Ready for Proposal

**Yes** — approach and affected areas are clear. Orchestrator should tell the user: (1) the feature will be a new dedicated page/route with a pure `lib/liquidacion.ts` module and exhaustive tests first; (2) three decisions to confirm: (a) exact definition of "días del semestre en curso" for prima + concrete start/end dates (or stated assumption) for the fixed worked example, (b) vacaciones clamping when días disfrutadas ≥ accrued, (c) auxilio de transporte as explicit toggle vs. reuse of the existing auto-derived badge; (3) the main legal spec's "No severance" non-goal must be amended in the same change.
